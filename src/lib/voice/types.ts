// ─────────────────────────────────────────────────────────────────────────
// The Voice provider adapter contract.
//
// NOTHING in the app talks to a voice-AI vendor directly. Everything goes
// through this interface. Today the only implementation is Retell. Tomorrow
// Vapi, Bland, or a self-hosted Twilio + Deepgram + TTS stack can be swapped
// in by writing one new adapter — no route, UI, or schema change.
//
// Rule: if a symbol in this file mentions a vendor, it is a bug. Vendor names
// appear in exactly two places — the `VoiceProviderName` union below (which is
// just a key) and the adapter file that implements that vendor.
// ─────────────────────────────────────────────────────────────────────────

export type VoiceProviderName =
  | 'retell'
  | 'vapi'
  | 'bland'
  | 'twilio_self_hosted'

// ── Agent configuration (provider-neutral) ────────────────────────────────

/**
 * Everything Replyee knows about a phone agent, expressed without reference to
 * any vendor's object model. Built from a `replyee_chatbots` row plus its
 * knowledge chunks — see `buildAgentConfigForBot()` in ./knowledge.
 */
export interface AgentConfig {
  /** Display name, for the vendor dashboard. Not spoken. */
  name: string
  /** The bot's persona + rules. Same text the chat widget uses. */
  systemPrompt: string
  /** First thing the agent says when it picks up. Empty = wait for caller. */
  greeting: string
  /** Vendor-neutral voice handle. Adapters map/default this themselves. */
  voiceId?: string
  /** BCP-47 locale, e.g. 'en-US'. Adapters default when omitted. */
  language?: string
  /**
   * Flattened knowledge-base text injected into the agent's prompt. Voice has
   * no per-turn retrieval hook, so the KB is compiled in at agent-create time.
   */
  knowledgeContext?: string
  /** Absolute URL the provider should POST call events to. */
  webhookUrl?: string
  /** Opaque key/value pairs echoed back on webhook events where supported. */
  metadata?: Record<string, string>
}

/** A handle to an agent that already exists at the provider. */
export interface ProviderAgentRef {
  /** The provider's id for the agent. */
  providerAgentId: string
  /**
   * Optional second id for providers that split "agent" (voice/telephony) from
   * "response engine" (the LLM + prompt). Retell does; Vapi does not.
   */
  providerEngineId?: string | null
}

/** Result of a successful create/update. */
export interface ProviderAgent extends ProviderAgentRef {
  /** Provider version number, when the provider versions agents. */
  version?: number | null
}

/** A phone number bound to an agent. */
export interface AssignedNumber {
  /** E.164, e.g. '+15615550123'. */
  phoneNumber: string
  providerAgentId: string
}

// ── Operation results ─────────────────────────────────────────────────────

export type VoiceOpStatus = 'ok' | 'failed' | 'not_configured'

export interface VoiceResult<T> {
  status: VoiceOpStatus
  data?: T
  /** Human-readable error when status === 'failed'. */
  error?: string
}

/** Returned by adapters whose env credentials are missing. */
export const notConfigured = <T>(name: VoiceProviderName): VoiceResult<T> => ({
  status: 'not_configured',
  error: `${name} voice adapter is not configured — add provider credentials to env.`,
})

export const opFailed = <T>(e: unknown): VoiceResult<T> => ({
  status: 'failed',
  error: e instanceof Error ? e.message : String(e),
})

// ── Call events (provider-neutral) ────────────────────────────────────────

export type CallDirection = 'inbound' | 'outbound' | 'unknown'

/** One utterance in a call transcript. Roles match replyee_messages.role. */
export interface TranscriptTurn {
  /** 'user' = the caller, 'assistant' = the AI agent. */
  role: 'user' | 'assistant'
  content: string
  /** Seconds from call start, when the provider reports word timings. */
  startSeconds?: number
  endSeconds?: number
}

/**
 * Lifecycle stage this event represents. Adapters normalise vendor event
 * names onto this union; anything unrecognised becomes 'unknown' and the
 * webhook route ignores it rather than guessing.
 */
export type CallEventKind = 'started' | 'ended' | 'analyzed' | 'unknown'

/**
 * A single call, as Replyee understands it. This is what gets written into
 * replyee_conversations / replyee_messages / replyee_voice_calls.
 */
export interface CallEvent {
  kind: CallEventKind
  /** The provider's id for this call. Our idempotency key. */
  providerCallId: string
  /** The provider's id for the agent that handled it. */
  providerAgentId: string
  direction: CallDirection
  fromNumber: string | null
  toNumber: string | null
  /** ISO-8601. */
  startedAt: string | null
  endedAt: string | null
  /**
   * Billable length. Voice is the only Boom product with real per-minute COGS
   * (~$0.07–0.10/min), so this MUST be captured on every call from day one.
   */
  durationSeconds: number | null
  transcript: TranscriptTurn[]
  recordingUrl: string | null
  /** Why the call ended, e.g. 'user_hangup'. Vendor string, passed through. */
  endReason: string | null
  /** Provider-reported cost in cents, when available. */
  costCents: number | null
  /** Untouched provider payload, persisted for debugging/replay. */
  raw: unknown
}

// ── Webhook handling ──────────────────────────────────────────────────────

/** The pieces of an inbound HTTP request an adapter needs to verify + parse. */
export interface WebhookRequest {
  /**
   * The raw, unparsed body string. Signature schemes HMAC the exact bytes —
   * never hand an adapter a re-serialised JSON.stringify() of a parsed object.
   */
  rawBody: string
  /** Lower-cased header name -> value. */
  headers: Record<string, string | null>
}

export type WebhookParseResult =
  | { status: 'ok'; event: CallEvent }
  /** Well-formed and authentic, but not an event we act on. */
  | { status: 'ignored'; reason: string }
  | { status: 'invalid_signature'; reason: string }
  | { status: 'not_configured'; reason: string }

// ── The contract ──────────────────────────────────────────────────────────

export interface VoiceProvider {
  name: VoiceProviderName

  /** True once the provider's credentials are present in env. */
  isConfigured(): boolean

  /** Create a phone agent from a Replyee bot's config + knowledge base. */
  createAgent(config: AgentConfig): Promise<VoiceResult<ProviderAgent>>

  /** Push prompt/voice/greeting changes to an existing agent. */
  updateAgent(ref: ProviderAgentRef, config: Partial<AgentConfig>): Promise<VoiceResult<ProviderAgent>>

  /** Tear the agent down at the provider. Should be idempotent. */
  deleteAgent(ref: ProviderAgentRef): Promise<VoiceResult<void>>

  /** Point an already-provisioned phone number at this agent for inbound calls. */
  assignNumber(ref: ProviderAgentRef, phoneNumber: string): Promise<VoiceResult<AssignedNumber>>

  /** Verify + normalise an inbound webhook into a provider-neutral CallEvent. */
  parseWebhook(req: WebhookRequest): Promise<WebhookParseResult>
}
