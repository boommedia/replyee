import { createAdminClient } from '@/lib/supabase/admin'
import type { AgentConfig } from './types'

// ── Turn an existing Replyee chatbot into a phone agent config ─────────────
// This is the whole product argument: a client who already has a working
// chatbot gets a working phone agent with ZERO reconfiguration — same
// system_prompt, same greeting, same knowledge base.
//
// Context assembly mirrors /api/chat's *fallback* branch (the one that loads
// the whole KB rather than running a vector query). That branch is the right
// one for voice: at agent-create time there is no caller question to embed, so
// there is nothing to run `replyee_match_chunks` against. The KB is compiled
// into the agent's standing prompt instead of retrieved per turn.

/** Same cap /api/chat uses when it falls back to loading the whole KB. */
const MAX_CHUNKS = 60

/** Guardrail: a huge KB inflates per-turn LLM latency, which is fatal on a call. */
const MAX_CONTEXT_CHARS = 24_000

export interface BotAgentSource {
  chatbotId: string
  userId: string
  botName: string
  config: AgentConfig
}

/**
 * Load a bot + its knowledge chunks and produce a provider-neutral AgentConfig.
 * Returns null when the bot doesn't exist.
 */
export async function buildAgentConfigForBot(
  botId: string,
  opts: { webhookUrl?: string; voiceId?: string; language?: string } = {}
): Promise<BotAgentSource | null> {
  const supabase = createAdminClient()

  type ChatbotRow = {
    id: string
    user_id: string
    name: string | null
    system_prompt: string | null
    greeting_message: string | null
    fallback_message: string | null
    restaurant_address: string | null
    restaurant_phone: string | null
    restaurant_hours: string | null
    restaurant_website: string | null
  }

  const { data, error } = await supabase
    .from('replyee_chatbots')
    .select('id, user_id, name, system_prompt, greeting_message, fallback_message, restaurant_address, restaurant_phone, restaurant_hours, restaurant_website')
    .eq('id', botId)
    .maybeSingle()

  // Admin client is untyped, so supabase-js collapses the row to GenericStringError.
  // Cast to the known shape (runtime unaffected).
  const bot = data as unknown as ChatbotRow | null
  if (error || !bot) return null

  const { data: chunks } = await supabase
    .from('replyee_knowledge_chunks')
    .select('content')
    .eq('chatbot_id', botId)
    .limit(MAX_CHUNKS)

  const kb = (chunks ?? [])
    .map((c: { content: string }) => c.content)
    .join('\n\n---\n\n')
    .slice(0, MAX_CONTEXT_CHARS)

  // Same structured business facts /api/chat and the widget already rely on.
  const facts = [
    bot.restaurant_address ? `Address: ${bot.restaurant_address}` : null,
    bot.restaurant_phone ? `Phone: ${bot.restaurant_phone}` : null,
    bot.restaurant_hours ? `Hours: ${bot.restaurant_hours}` : null,
    bot.restaurant_website ? `Website: ${bot.restaurant_website}` : null,
  ].filter(Boolean)

  const knowledgeContext = [facts.length ? `Business details:\n${facts.join('\n')}` : null, kb]
    .filter(Boolean)
    .join('\n\n---\n\n')

  // Identical default to /api/chat, so voice and chat answer the same way.
  const systemPrompt =
    bot.system_prompt ??
    `You are a helpful AI assistant for ${bot.name}. Answer questions based only on the provided context. ` +
      `If the answer is not in the context, say so honestly and offer to connect the caller with the team.`

  return {
    chatbotId: bot.id,
    userId: bot.user_id,
    botName: bot.name,
    config: {
      name: bot.name,
      systemPrompt,
      // The bot's own greeting, but spoken. Falls back to a phone-shaped hello.
      greeting: bot.greeting_message || `Thanks for calling ${bot.name}. How can I help?`,
      voiceId: opts.voiceId,
      language: opts.language,
      knowledgeContext: knowledgeContext || undefined,
      webhookUrl: opts.webhookUrl ?? defaultWebhookUrl(),
      metadata: { chatbot_id: bot.id },
    },
  }
}

/** Where providers should POST call events. */
export function defaultWebhookUrl(): string | undefined {
  const base = process.env.NEXT_PUBLIC_SITE_URL
  return base ? `${base.replace(/\/$/, '')}/api/voice/webhook` : undefined
}
