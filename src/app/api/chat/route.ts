import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { embedText } from '@/lib/rag/embed'

// The chat widget runs on client domains and calls this endpoint cross-origin.
// bot-config/handoff already send these headers; chat did not, so the preflight
// OPTIONS returned no Access-Control-Allow-Origin and every browser blocked the
// POST — surfacing to visitors as "Sorry, something went wrong." No cookies are
// used (auth is the public botId), so a wildcard origin is safe.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function POST(req: NextRequest) {
  const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  try {
    const { botId, message, sessionId, orderContext } = await req.json()

    if (!botId || !message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Missing botId or message' }, { status: 400, headers: CORS })
    }

    const supabase = createAdminClient()

    const { data: bot, error: botError } = await supabase
      .from('replyee_chatbots')
      .select('id, name, system_prompt, accent_color, user_id, is_active, restaurant_address, restaurant_phone, restaurant_hours, restaurant_website')
      .eq('id', botId)
      .single()

    if (botError || !bot) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404, headers: CORS })
    }
    if (!bot.is_active) {
      return NextResponse.json({ error: 'Chatbot is inactive' }, { status: 403, headers: CORS })
    }

    // Live chat: if a human agent owns this conversation, store the message
    // and stay silent — the agent replies via the Live Inbox (Realtime).
    if (sessionId) {
      const { data: convo } = await supabase
        .from('replyee_conversations')
        .select('mode, unread_by_agent')
        .eq('session_id', sessionId)
        .maybeSingle()

      if (convo?.mode === 'human') {
        await supabase.from('replyee_messages').insert(
          { session_id: sessionId, chatbot_id: botId, role: 'user', content: message }
        )
        await supabase.from('replyee_conversations').update({
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          unread_by_agent: (convo.unread_by_agent ?? 0) + 1,
        }).eq('session_id', sessionId)
        return NextResponse.json({ human: true, sessionId }, { headers: CORS })
      }
    }

    let context = ''
    try {
      const queryEmbedding = await embedText(message)
      const { data: chunks } = await supabase.rpc('replyee_match_chunks', {
        query_embedding: queryEmbedding,
        chatbot_id: botId,
        match_count: 5,
        match_threshold: 0.5,
      })
      context = chunks?.map((c: { content: string }) => c.content).join('\n\n---\n\n') ?? ''
    } catch {
      // No embedding provider (Claude-only KBs). Load the whole knowledge base —
      // small per-site KBs fit in Claude's context, so vector search isn't needed.
      const { data: allChunks } = await supabase
        .from('replyee_knowledge_chunks')
        .select('content')
        .eq('chatbot_id', botId)
        .limit(60)
      context = allChunks?.map((c: { content: string }) => c.content).join('\n\n---\n\n') ?? ''
    }

    const systemPrompt = bot.system_prompt ??
      `You are a helpful AI assistant for ${bot.name}. Answer questions based only on the provided context. If the answer is not in the context, say so honestly and offer to connect the user with the team.`

    // Append live order context from the BOO widget (cart/order data for this visitor)
    const orderContextSection = orderContext
      ? `\n\nCurrent visitor order context (from the ordering platform):\n${
          [
            orderContext.orderId    ? `Order ID: ${orderContext.orderId}` : null,
            orderContext.status     ? `Status: ${orderContext.status}`    : null,
            Array.isArray(orderContext.items) && orderContext.items.length
              ? `Items in order: ${orderContext.items.join(', ')}` : null,
            orderContext.total      ? `Total: $${Number(orderContext.total).toFixed(2)}` : null,
            orderContext.customerEmail ? `Customer email: ${orderContext.customerEmail}` : null,
          ].filter(Boolean).join('\n')
        }`
      : ''

    // Business details the owner configured in the dashboard (address / phone /
    // hours / website). These are authoritative facts — without them the bot
    // could not answer "what time do you close?" even though the owner had
    // filled the fields in. Injected ahead of the RAG context so the
    // "only answer from context" instruction doesn't suppress them.
    const businessInfo = [
      bot.restaurant_address ? `Address: ${bot.restaurant_address}` : null,
      bot.restaurant_phone   ? `Phone: ${bot.restaurant_phone}`     : null,
      bot.restaurant_hours   ? `Hours: ${bot.restaurant_hours}`     : null,
      bot.restaurant_website ? `Website: ${bot.restaurant_website}` : null,
    ].filter(Boolean).join('\n')

    const businessSection = businessInfo
      ? `\n\nVerified business details for ${bot.name} (treat these as authoritative and answer directly from them):\n${businessInfo}`
      : ''

    const fullSystem = context
      ? `${systemPrompt}${businessSection}\n\nKnowledge base context:\n---\n${context}\n---\nAnswer from the business details above and this context. If unsure, say you don't have that information.${orderContextSection}`
      : `${systemPrompt}${businessSection}\n\nNote: No specific knowledge base content found for this question.${orderContextSection}`

    let history: { role: 'user' | 'assistant'; content: string }[] = []
    if (sessionId) {
      const { data: msgs } = await supabase
        .from('replyee_messages')
        .select('role, content')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(10)
      history = (msgs ?? []) as typeof history
    }

    const response = await claude.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: fullSystem,
      messages: [
        ...history,
        { role: 'user', content: message },
      ],
    })

    const answer = response.content[0].type === 'text' ? response.content[0].text : ''

    const conversationId = sessionId ?? crypto.randomUUID()
    supabase.from('replyee_messages').insert([
      { session_id: conversationId, chatbot_id: botId, role: 'user',      content: message },
      { session_id: conversationId, chatbot_id: botId, role: 'assistant', content: answer  },
    ]).then(() => {
      supabase.rpc('replyee_increment_conversation_count', { bot_id: botId })
    })

    // Keep the conversations row in sync (powers Conversations list + Live Inbox)
    supabase.from('replyee_conversations').upsert(
      {
        session_id: conversationId,
        chatbot_id: botId,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'session_id' }
    ).then(() => {})

    return NextResponse.json({ answer, sessionId: conversationId }, { headers: CORS })

  } catch (err) {
    console.error('[/api/chat]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS })
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
