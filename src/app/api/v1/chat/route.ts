import { NextRequest, NextResponse } from 'next/server'
import { authApiKey, unauthorized } from '@/lib/apiV1Auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/v1/chat
 * Body: { message: string, bot_id?: string, session_id?: string }
 * Returns the chatbot's answer (RAG). If bot_id is omitted, uses the
 * account's first active bot. Reuses the existing /api/chat engine.
 */
export async function POST(req: NextRequest) {
  const auth = await authApiKey(req)
  if (!auth) return unauthorized()

  const body = await req.json().catch(() => ({} as Record<string, unknown>))
  const message = typeof body.message === 'string' ? body.message : ''
  let botId = typeof body.bot_id === 'string' ? body.bot_id : ''
  const sessionId = typeof body.session_id === 'string' ? body.session_id : undefined

  if (!message.trim()) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 })
  }

  const admin = createAdminClient()

  if (botId) {
    // Ensure the bot belongs to this key's account.
    const { data: bot } = await admin
      .from('replyee_chatbots')
      .select('id')
      .eq('id', botId)
      .eq('user_id', auth.userId)
      .maybeSingle()
    if (!bot) return NextResponse.json({ error: 'bot_id not found for this account' }, { status: 404 })
  } else {
    const { data: bot } = await admin
      .from('replyee_chatbots')
      .select('id')
      .eq('user_id', auth.userId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    botId = (bot?.id as string) || ''
  }

  if (!botId) return NextResponse.json({ error: 'No active bot on this account' }, { status: 404 })

  // Reuse the existing RAG chat engine.
  const res = await fetch(new URL('/api/chat', req.url), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ botId, message, sessionId }),
  })
  const data = await res.json().catch(() => ({ error: 'chat engine error' }))
  return NextResponse.json(data, { status: res.status })
}
