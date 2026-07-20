import crypto from 'crypto'
import type {
  AgentConfig,
  AssignedNumber,
  CallDirection,
  CallEvent,
  CallEventKind,
  ProviderAgent,
  ProviderAgentRef,
  TranscriptTurn,
  VoiceProvider,
  VoiceResult,
  WebhookParseResult,
  WebhookRequest,
} from './types'
import { notConfigured, opFailed } from './types'

// ── Retell AI adapter ──────────────────────────────────────────────────────
// THE ONLY FILE IN REPLYEE THAT KNOWS RETELL EXISTS.
//
// Retell splits what we call an "agent" into two objects:
//   1. a Retell LLM  (the prompt + model)      -> llm_id      -> providerEngineId
//   2. an Agent      (voice + telephony + hooks)-> agent_id    -> providerAgentId
// We create/update/delete both together and hide the pair behind ProviderAgentRef.
//
// Docs verified 2026-07-20 against docs.retellai.com. Anything we could not
// confirm from the live docs is marked `// UNVERIFIED`.

const API = 'https://api.retellai.com'
const TIMEOUT_MS = 20_000

// Retell's own sample voice id from the create-agent docs. Any Retell voice id
// works; this is only the fallback when AgentConfig.voiceId is omitted.
// UNVERIFIED — confirm this voice id is still available on the account's plan
// before production use (voices are listed via the Retell dashboard).
const DEFAULT_VOICE_ID = 'retell-Cimo'
const DEFAULT_LANGUAGE = 'en-US'

// Verified: create-retell-llm accepts a `model` enum and defaults to gpt-4.1.
const DEFAULT_MODEL = 'gpt-4.1'

function cfg() {
  return {
    apiKey: process.env.RETELL_API_KEY,
    // Retell signs webhooks with the API key that carries the "webhook" badge.
    // If that key differs from the one used for REST calls, set it separately.
    webhookSecret: process.env.RETELL_WEBHOOK_SECRET || process.env.RETELL_API_KEY,
  }
}

function configured() {
  return Boolean(cfg().apiKey)
}

/**
 * One fetch wrapper for the whole Retell surface. Never throws a bare fetch
 * error — always a message the caller can surface. Mirrors Posttee's graph().
 */
async function retell(
  path: string,
  init: { method: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown } = { method: 'GET' }
) {
  const { apiKey } = cfg()
  const res = await fetch(`${API}${path}`, {
    method: init.method,
    headers: {
      // Verified: "Authentication header containing API key ... format is 'Bearer YOUR_API_KEY'"
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })

  // Verified: delete-agent returns 204 No Content.
  if (res.status === 204) return {}

  const text = await res.text()
  let json: Record<string, unknown> = {}
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    json = {}
  }

  if (!res.ok) {
    const msg =
      (typeof json.error_message === 'string' && json.error_message) ||
      (typeof json.message === 'string' && json.message) ||
      text.slice(0, 300) ||
      `Retell error (${res.status})`
    throw new Error(`${msg} [${init.method} ${path} -> ${res.status}]`)
  }
  return json
}

/** Compose the single prompt string Retell's LLM engine gets. */
function generalPrompt(config: Pick<AgentConfig, 'systemPrompt' | 'knowledgeContext'>) {
  const base =
    config.systemPrompt?.trim() ||
    'You are a helpful phone assistant. Be concise and natural — this is a spoken conversation.'

  const voiceRules = [
    '',
    'You are speaking on a phone call, not typing. Keep answers to one or two short sentences.',
    'Never read out URLs, markdown, or long lists. Offer to text or email details instead.',
    'If you do not know something, say so plainly and offer to take a message.',
  ].join('\n')

  if (!config.knowledgeContext?.trim()) return `${base}${voiceRules}`

  return [
    base,
    voiceRules,
    '',
    'Knowledge base:',
    '---',
    config.knowledgeContext.trim(),
    '---',
    'Only answer from this knowledge base. If the answer is not here, say you do not have that information.',
  ].join('\n')
}

// ── Webhook payload shapes (verified against docs.retellai.com/features/webhook) ──

interface RetellTranscriptTurn {
  role?: string
  content?: string
  words?: { word?: string; start?: number; end?: number }[]
}

interface RetellCall {
  call_id?: string
  agent_id?: string
  call_type?: string
  direction?: string
  from_number?: string
  to_number?: string
  call_status?: string
  start_timestamp?: number
  end_timestamp?: number
  duration_ms?: number
  disconnection_reason?: string
  transcript?: string
  transcript_object?: RetellTranscriptTurn[]
  recording_url?: string
  call_cost?: { combined_cost?: number; total_duration_seconds?: number }
  metadata?: Record<string, unknown>
}

const EVENT_MAP: Record<string, CallEventKind> = {
  call_started: 'started',
  call_ended: 'ended',
  call_analyzed: 'analyzed',
}

function mapDirection(d?: string): CallDirection {
  if (d === 'inbound' || d === 'outbound') return d
  return 'unknown'
}

function mapTranscript(turns?: RetellTranscriptTurn[]): TranscriptTurn[] {
  if (!Array.isArray(turns)) return []
  return turns
    .filter((t) => typeof t.content === 'string' && t.content.trim().length > 0)
    // Verified roles: 'agent' | 'user' | 'transfer_target'. The AI agent maps to
    // our 'assistant' — 'agent' in replyee_messages means a *human* takeover.
    .map((t) => ({
      role: t.role === 'user' ? ('user' as const) : ('assistant' as const),
      content: (t.content as string).trim(),
      startSeconds: t.words?.[0]?.start,
      endSeconds: t.words?.[t.words.length - 1]?.end,
    }))
}

function toIso(ms?: number): string | null {
  return typeof ms === 'number' && ms > 0 ? new Date(ms).toISOString() : null
}

function durationSeconds(call: RetellCall): number | null {
  // Verified on get-call: `duration_ms`. NOT present in the documented
  // call_ended webhook sample, so fall back to the timestamp delta.
  if (typeof call.duration_ms === 'number') return Math.round(call.duration_ms / 1000)
  if (typeof call.call_cost?.total_duration_seconds === 'number') {
    return Math.round(call.call_cost.total_duration_seconds)
  }
  if (typeof call.start_timestamp === 'number' && typeof call.end_timestamp === 'number') {
    return Math.max(0, Math.round((call.end_timestamp - call.start_timestamp) / 1000))
  }
  return null
}

/**
 * Verify X-Retell-Signature.
 * Verified format: `v={unix_ms_timestamp},d={hex_hmac}` where the digest is
 * HMAC-SHA256(rawBody + timestamp) keyed with the Retell API key, and the
 * timestamp must be within 5 minutes of now.
 */
function verifySignature(rawBody: string, header: string | null, secret: string): { ok: boolean; reason?: string } {
  if (!header) return { ok: false, reason: 'missing X-Retell-Signature header' }

  const m = /v=(\d+),d=(.*)/.exec(header.trim())
  if (!m) return { ok: false, reason: 'malformed X-Retell-Signature header' }

  const [, timestamp, digest] = m

  const skewMs = Math.abs(Date.now() - Number(timestamp))
  if (!Number.isFinite(skewMs) || skewMs > 5 * 60_000) {
    return { ok: false, reason: 'signature timestamp outside the 5 minute window' }
  }

  const expected = crypto.createHmac('sha256', secret).update(rawBody + timestamp).digest('hex')
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(digest, 'utf8')
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: 'signature mismatch' }
  }
  return { ok: true }
}

// ── The adapter ────────────────────────────────────────────────────────────

export const retellProvider: VoiceProvider = {
  name: 'retell',

  isConfigured: configured,

  async createAgent(config: AgentConfig): Promise<VoiceResult<ProviderAgent>> {
    if (!configured()) return notConfigured('retell')
    try {
      // 1. Response engine — the prompt + model.
      // Verified: POST /create-retell-llm { general_prompt, begin_message, model } -> { llm_id, version }
      const llm = (await retell('/create-retell-llm', {
        method: 'POST',
        body: {
          general_prompt: generalPrompt(config),
          // Empty string = agent waits for the caller to speak first (verified).
          begin_message: config.greeting ?? '',
          model: DEFAULT_MODEL,
        },
      })) as { llm_id?: string; version?: number }

      if (!llm.llm_id) throw new Error('Retell did not return an llm_id')

      // 2. Agent — voice, telephony, webhooks.
      // Verified: POST /create-agent { response_engine, voice_id, agent_name, language, webhook_url }
      const agent = (await retell('/create-agent', {
        method: 'POST',
        body: {
          response_engine: { type: 'retell-llm', llm_id: llm.llm_id },
          voice_id: config.voiceId || DEFAULT_VOICE_ID,
          agent_name: config.name,
          language: config.language || DEFAULT_LANGUAGE,
          ...(config.webhookUrl ? { webhook_url: config.webhookUrl } : {}),
          // Verified event names; these are also the defaults.
          webhook_events: ['call_started', 'call_ended', 'call_analyzed'],
        },
      })) as { agent_id?: string; version?: number }

      if (!agent.agent_id) throw new Error('Retell did not return an agent_id')

      return {
        status: 'ok',
        data: {
          providerAgentId: agent.agent_id,
          providerEngineId: llm.llm_id,
          version: agent.version ?? null,
        },
      }
    } catch (e) {
      return opFailed(e)
    }
  },

  async updateAgent(ref: ProviderAgentRef, config: Partial<AgentConfig>): Promise<VoiceResult<ProviderAgent>> {
    if (!configured()) return notConfigured('retell')
    try {
      // Prompt/greeting live on the LLM object; voice/language/webhook on the agent.
      const touchesPrompt =
        config.systemPrompt !== undefined ||
        config.knowledgeContext !== undefined ||
        config.greeting !== undefined

      if (touchesPrompt && ref.providerEngineId) {
        // UNVERIFIED — the update-retell-llm endpoint is listed in Retell's docs
        // index, but the path/method below is inferred from the update-agent
        // convention (`PATCH /update-{resource}/{id}`). Confirm before production.
        await retell(`/update-retell-llm/${ref.providerEngineId}`, {
          method: 'PATCH',
          body: {
            ...(config.systemPrompt !== undefined || config.knowledgeContext !== undefined
              ? {
                  general_prompt: generalPrompt({
                    systemPrompt: config.systemPrompt ?? '',
                    knowledgeContext: config.knowledgeContext,
                  }),
                }
              : {}),
            ...(config.greeting !== undefined ? { begin_message: config.greeting } : {}),
          },
        })
      }

      const agentPatch: Record<string, unknown> = {}
      if (config.name !== undefined) agentPatch.agent_name = config.name
      if (config.voiceId !== undefined) agentPatch.voice_id = config.voiceId
      if (config.language !== undefined) agentPatch.language = config.language
      if (config.webhookUrl !== undefined) agentPatch.webhook_url = config.webhookUrl

      let version: number | null = null
      if (Object.keys(agentPatch).length > 0) {
        // Verified: PATCH /update-agent/{agent_id}
        const agent = (await retell(`/update-agent/${ref.providerAgentId}`, {
          method: 'PATCH',
          body: agentPatch,
        })) as { version?: number }
        version = agent.version ?? null
      }

      return { status: 'ok', data: { ...ref, version } }
    } catch (e) {
      return opFailed(e)
    }
  },

  async deleteAgent(ref: ProviderAgentRef): Promise<VoiceResult<void>> {
    if (!configured()) return notConfigured('retell')
    try {
      // Verified: DELETE /delete-agent/{agent_id} -> 204, deletes all versions.
      await retell(`/delete-agent/${ref.providerAgentId}`, { method: 'DELETE' })

      if (ref.providerEngineId) {
        // UNVERIFIED — delete-retell-llm is listed in the docs index; the path
        // below follows the same convention. A failure here is non-fatal: the
        // agent is already gone, an orphaned LLM object costs nothing.
        await retell(`/delete-retell-llm/${ref.providerEngineId}`, { method: 'DELETE' }).catch((e) =>
          console.error('[voice/retell] orphaned Retell LLM', ref.providerEngineId, e)
        )
      }
      return { status: 'ok' }
    } catch (e) {
      return opFailed(e)
    }
  },

  async assignNumber(ref: ProviderAgentRef, phoneNumber: string): Promise<VoiceResult<AssignedNumber>> {
    if (!configured()) return notConfigured('retell')
    try {
      // Verified: PATCH /update-phone-number/{phone_number} (E.164 in the path).
      // The current docs show `inbound_agents`/`outbound_agents` as arrays of
      // { agent_id, agent_version, weight } with weights summing to 1.
      // UNVERIFIED — older Retell SDK versions used scalar `inbound_agent_id` /
      // `outbound_agent_id`. If a 4xx comes back complaining about the body,
      // switch to the scalar form. Both are sent-compatible one at a time only.
      await retell(`/update-phone-number/${encodeURIComponent(phoneNumber)}`, {
        method: 'PATCH',
        body: {
          inbound_agents: [{ agent_id: ref.providerAgentId, weight: 1 }],
          outbound_agents: [{ agent_id: ref.providerAgentId, weight: 1 }],
        },
      })
      return { status: 'ok', data: { phoneNumber, providerAgentId: ref.providerAgentId } }
    } catch (e) {
      return opFailed(e)
    }
  },

  async parseWebhook(req: WebhookRequest): Promise<WebhookParseResult> {
    const { webhookSecret } = cfg()
    if (!webhookSecret) {
      return { status: 'not_configured', reason: 'RETELL_API_KEY / RETELL_WEBHOOK_SECRET not set' }
    }

    const sig = verifySignature(req.rawBody, req.headers['x-retell-signature'], webhookSecret)
    if (!sig.ok) return { status: 'invalid_signature', reason: sig.reason || 'invalid signature' }

    let body: { event?: string; call?: RetellCall }
    try {
      body = JSON.parse(req.rawBody)
    } catch {
      return { status: 'ignored', reason: 'body is not JSON' }
    }

    // Verified top-level shape: { "event": "call_ended", "call": { ... } }.
    // Retell also emits { "event": "chat_started", "chat": {...} } for its chat
    // product — we deliberately ignore those; Replyee owns chat itself.
    const kind = EVENT_MAP[body.event ?? ''] ?? 'unknown'
    if (kind === 'unknown') return { status: 'ignored', reason: `unhandled event "${body.event}"` }

    const call = body.call
    if (!call?.call_id || !call.agent_id) {
      return { status: 'ignored', reason: 'event has no call_id/agent_id' }
    }

    const event: CallEvent = {
      kind,
      providerCallId: call.call_id,
      providerAgentId: call.agent_id,
      direction: mapDirection(call.direction),
      fromNumber: call.from_number ?? null,
      toNumber: call.to_number ?? null,
      startedAt: toIso(call.start_timestamp),
      endedAt: toIso(call.end_timestamp),
      durationSeconds: kind === 'started' ? null : durationSeconds(call),
      transcript: mapTranscript(call.transcript_object),
      // Verified as a field on the call object (get-call); absent from the
      // documented webhook sample, so treat it as optional.
      recordingUrl: call.recording_url ?? null,
      endReason: call.disconnection_reason ?? null,
      costCents:
        typeof call.call_cost?.combined_cost === 'number' ? Math.round(call.call_cost.combined_cost) : null,
      raw: body,
    }

    return { status: 'ok', event }
  },
}
