import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { botId, visitorId, sessionId, page, referrer, utm, device } = await req.json()

    if (!botId || !visitorId) {
      return NextResponse.json({ error: 'Missing botId or visitorId' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Verify bot exists and is active
    const { data: bot, error: botError } = await supabase
      .from('replyee_chatbots')
      .select('id')
      .eq('id', botId)
      .eq('is_active', true)
      .single()

    if (botError || !bot) {
      return NextResponse.json({ error: 'Chatbot not found or inactive' }, { status: 404 })
    }

    // Get existing session (if any)
    const { data: existing } = await supabase
      .from('replyee_visitor_sessions')
      .select('id, current_page, page_views, visits, score')
      .eq('chatbot_id', botId)
      .eq('visitor_id', visitorId)
      .maybeSingle()

    let pageViewsIncrement = 0
    if (!existing) {
      // New visitor
      pageViewsIncrement = 1
    } else if (existing.current_page && existing.current_page !== page) {
      // Page changed — increment page_views
      pageViewsIncrement = 1
    }

    // Upsert visitor session
    const { error: upsertError } = await supabase
      .from('replyee_visitor_sessions')
      .upsert(
        {
          chatbot_id: botId,
          visitor_id: visitorId,
          session_id: sessionId || null,
          current_page: page,
          referrer: referrer || null,
          utm: utm || null,
          device: device || null,
          page_views: existing ? (existing.page_views + pageViewsIncrement) : 1,
          visits: existing ? existing.visits : 1,
          score: existing ? existing.score : 0,
          last_seen: new Date().toISOString(),
        },
        { onConflict: 'chatbot_id,visitor_id' }
      )

    if (upsertError) {
      console.error('Visitor session upsert error:', upsertError)
      return NextResponse.json({ error: 'Failed to track visitor' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, pageViews: (existing?.page_views || 0) + pageViewsIncrement })
  } catch (error) {
    console.error('Visitor heartbeat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
