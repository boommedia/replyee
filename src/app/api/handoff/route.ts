import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendHandoffAlert } from '@/lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function POST(req: NextRequest) {
  try {
    const { botId, sessionId } = await req.json()
    if (!botId || !sessionId) {
      return NextResponse.json({ error: 'Missing botId or sessionId' }, { status: 400, headers: CORS })
    }

    const supabase = createAdminClient()

    const { data: bot } = await supabase
      .from('replyee_chatbots')
      .select('id, name, user_id, is_active')
      .eq('id', botId)
      .maybeSingle()

    if (!bot || !bot.is_active) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404, headers: CORS })
    }

    await supabase.from('replyee_conversations').upsert(
      {
        session_id: sessionId,
        chatbot_id: botId,
        mode: 'human',
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'session_id' }
    )

    // Alert the bot owner that a visitor is waiting
    const { data: owner } = await supabase
      .from('replyee_profiles')
      .select('email, full_name')
      .eq('id', bot.user_id)
      .maybeSingle()

    if (owner?.email) {
      const { data: lastMsg } = await supabase
        .from('replyee_messages')
        .select('content')
        .eq('session_id', sessionId)
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      sendHandoffAlert({
        to: owner.email,
        botName: bot.name,
        lastQuestion: lastMsg?.content ?? '(no message yet)',
      }).catch(err => console.error('[handoff] email failed', err))
    }

    return NextResponse.json({ ok: true }, { headers: CORS })
  } catch (err) {
    console.error('[/api/handoff]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS })
  }
}
