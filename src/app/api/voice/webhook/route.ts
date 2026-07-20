import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getProvider, knownProviders, DEFAULT_VOICE_PROVIDER } from '@/lib/voice/registry'
import type { CallEvent, VoiceProviderName } from '@/lib/voice/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ── Voice provider webhook sink ────────────────────────────────────────────
// One endpoint for every voice provider. It knows nothing about any vendor —
// it picks an adapter, hands it the raw body, and persists the neutral
// CallEvent that comes back.
//
// A call is written into the SAME tables as chat:
//   replyee_conversations (channel = 'voice')  -> shows up in the Live Inbox
//   replyee_messages      (transcript turns)   -> shows up in the transcript
//   replyee_voice_calls   (duration, cost)     -> the metering record
//
// Provider selection: /api/voice/webhook?provider=retell. Defaults to
// VOICE_PROVIDER (or 'retell') so a provider that can't send query params on
// its webhook URL still works.

function resolveProvider(req: NextRequest): VoiceProviderName | null {
  const q = req.nextUrl.searchParams.get('provider')
  if (!q) return DEFAULT_VOICE_PROVIDER
  return (knownProviders() as string[]).includes(q) ? (q as VoiceProviderName) : null
}

export async function POST(req: NextRequest) {
  const providerName = resolveProvider(req)
  if (!providerName) {
    return NextResponse.json({ error: 'Unknown voice provider' }, { status: 400 })
  }

  try {
    // Signature schemes HMAC the exact bytes — read the body as text, once,
    // and never hand the adapter a re-serialised object.
    const rawBody = await req.text()

    const headers: Record<string, string | null> = {}
    req.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value
    })

    const provider = getProvider(providerName)
    const parsed = await provider.parseWebhook({ rawBody, headers })

    if (parsed.status === 'not_configured') {
      console.error(`[/api/voice/webhook] ${providerName} not configured:`, parsed.reason)
      return NextResponse.json({ error: 'Voice provider not configured' }, { status: 503 })
    }
    if (parsed.status === 'invalid_signature') {
      console.warn(`[/api/voice/webhook] rejected ${providerName}:`, parsed.reason)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    if (parsed.status === 'ignored') {
      // Authentic but not actionable — 200 so the provider stops retrying.
      return NextResponse.json({ ok: true, ignored: parsed.reason })
    }

    await persistCall(providerName, parsed.event)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[/api/voice/webhook]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function persistCall(providerName: VoiceProviderName, event: CallEvent) {
  const supabase = createAdminClient()

  // 1. Which Replyee bot owns this provider agent?
  const { data: voiceAgent } = await supabase
    .from('replyee_voice_agents')
    .select('chatbot_id')
    .eq('provider', providerName)
    .eq('provider_agent_id', event.providerAgentId)
    .maybeSingle()

  if (!voiceAgent) {
    console.warn(
      `[/api/voice/webhook] no replyee_voice_agents row for ${providerName}:${event.providerAgentId} — dropping call ${event.providerCallId}`
    )
    return
  }
  const chatbotId = voiceAgent.chatbot_id as string

  const { data: bot } = await supabase
    .from('replyee_chatbots')
    .select('user_id')
    .eq('id', chatbotId)
    .maybeSingle()

  if (!bot) return
  const userId = bot.user_id as string

  // 2. Idempotency: one row per provider call. call_started creates it, later
  //    events (call_ended / call_analyzed) update the same row in place.
  const { data: existing } = await supabase
    .from('replyee_voice_calls')
    .select('id, session_id')
    .eq('provider', providerName)
    .eq('provider_call_id', event.providerCallId)
    .maybeSingle()

  // replyee_conversations.session_id is a uuid; provider call ids are not, so
  // we mint a uuid on first sight and keep the mapping on the call row.
  const sessionId: string = (existing?.session_id as string) ?? crypto.randomUUID()

  const nowIso = new Date().toISOString()
  const status = event.kind === 'started' ? 'started' : event.kind === 'ended' ? 'ended' : 'analyzed'

  // 3. Conversation row — this is what puts the call in the existing inbox.
  const callerLabel = event.direction === 'outbound' ? event.toNumber : event.fromNumber
  await supabase.from('replyee_conversations').upsert(
    {
      session_id: sessionId,
      chatbot_id: chatbotId,
      channel: 'voice',
      last_message_at: event.endedAt ?? event.startedAt ?? nowIso,
      updated_at: nowIso,
    },
    { onConflict: 'session_id' }
  )

  // 4. Metering record. duration_seconds is the whole point — captured on
  //    every call so usage billing can be added without a backfill.
  const callRow = {
    chatbot_id: chatbotId,
    user_id: userId,
    session_id: sessionId,
    provider: providerName,
    provider_call_id: event.providerCallId,
    direction: event.direction,
    from_number: event.fromNumber,
    to_number: event.toNumber,
    started_at: event.startedAt,
    ended_at: event.endedAt,
    duration_seconds: event.durationSeconds,
    recording_url: event.recordingUrl,
    end_reason: event.endReason,
    provider_cost_cents: event.costCents,
    status,
    raw_payload: event.raw,
    updated_at: nowIso,
  }

  if (existing) {
    // Never let a late/duplicate event blank out a value we already have.
    const patch = Object.fromEntries(
      Object.entries(callRow).filter(([, v]) => v !== null && v !== undefined)
    )
    await supabase.from('replyee_voice_calls').update(patch).eq('id', existing.id)
  } else {
    await supabase.from('replyee_voice_calls').insert(callRow)
    await supabase.rpc('replyee_increment_conversation_count', { bot_id: chatbotId })
  }

  // 5. Transcript -> messages. Only write once the transcript is final, and
  //    only if we haven't already written it (call_ended then call_analyzed
  //    both carry a transcript).
  if (event.kind !== 'started' && event.transcript.length > 0) {
    const { count } = await supabase
      .from('replyee_messages')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId)

    if (!count) {
      const header = [
        `☎ ${event.direction === 'outbound' ? 'Outbound call to' : 'Call from'} ${callerLabel ?? 'unknown number'}`,
        event.durationSeconds != null ? `${formatDuration(event.durationSeconds)}` : null,
        event.endReason ? event.endReason.replace(/_/g, ' ') : null,
      ]
        .filter(Boolean)
        .join(' · ')

      // Stamp created_at from the call clock. A single batch insert would give
      // every turn the same default now(), and the inbox orders by created_at.
      const base = event.startedAt ? Date.parse(event.startedAt) : Date.now()

      await supabase.from('replyee_messages').insert([
        { session_id: sessionId, chatbot_id: chatbotId, role: 'assistant', content: header,
          created_at: new Date(base).toISOString() },
        ...event.transcript.map((t, i) => ({
          session_id: sessionId,
          chatbot_id: chatbotId,
          role: t.role,
          content: t.content,
          created_at: new Date(
            base + Math.round((t.startSeconds ?? i) * 1000) + 1
          ).toISOString(),
        })),
      ])
    }
  }
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}
