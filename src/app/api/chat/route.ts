import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { embedText } from '@/lib/rag/embed'

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Public endpoint — no auth required (widget calls this)
export async function POST(req: NextRequest) {
  try {
    const { botId, message, sessionId } = await req.json()

    if (!botId || !message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Missing botId or message' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. Load chatbot config
    const { data: bot, error: botError } = await supabase
      .from('chatbots')
      .select('id, name, system_prompt, accent_color, user_id, is_active')
      .eq('id', botId)
      .single()

    if (botError || !bot) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 })
    }
    if (!bot.is_active) {
      return NextResponse.json({ error: 'Chatbot is inactive' }, { status: 403 })
    }

    // 2. Embed the user's message
    const queryEmbedding = await embedText(message)

    // 3. Vector similarity search (pgvector cosine distance)
    const { data: chunks } = await supabase.rpc('match_chunks', {
      query_embedding: queryEmbedding,
      chatbot_id: botId,
      match_count: 5,
      match_threshold: 0.5,
    })

    const context = chunks?.map((c: { content: string }) => c.content).join('\n\n---\n\n') ?? ''

    // 4. Build system prompt
    const systemPrompt = bot.system_prompt ??
      `You are a helpful AI assistant for ${bot.name}. Answer questions based only on the provided context. If the answer is not in the context, say so honestly and offer to connect the user with the team.`

    const fullSystem = context
      ? `${systemPrompt}\n\nKnowledge base context:\n---\n${context}\n---\nOnly answer based on this context. If unsure, say you don't have that information.`
      : `${systemPrompt}\n\nNote: No specific knowledge base content found for this question.`

    // 5. Get conversation history (last 10 messages for context)
    let history: { role: 'user' | 'assistant'; content: string }[] = []
    if (sessionId) {
      const { data: msgs } = await supabase
        .from('messages')
        .select('role, content')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(10)
      history = (msgs ?? []) as typeof history
    }

    // 6. Call Claude Haiku (fast + cheap)
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

    // 7. Store conversation asynchronously (non-blocking)
    const conversationId = sessionId ?? crypto.randomUUID()
    supabase.from('messages').insert([
      { session_id: conversationId, chatbot_id: botId, role: 'user',      content: message },
      { session_id: conversationId, chatbot_id: botId, role: 'assistant', content: answer  },
    ]).then(() => {
      // increment conversation count
      supabase.rpc('increment_conversation_count', { bot_id: botId })
    })

    return NextResponse.json({ answer, sessionId: conversationId })

  } catch (err) {
    console.error('[/api/chat]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
