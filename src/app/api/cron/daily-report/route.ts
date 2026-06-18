import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendDailyReport } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get all active bot owners with their email
  const { data: profiles, error: profileError } = await supabase
    .from('replyee_profiles')
    .select('id, email, plan')
    .neq('plan', null)

  if (profileError || !profiles?.length) {
    return NextResponse.json({ sent: 0 })
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  const today = new Date(yesterday)
  today.setDate(today.getDate() + 1)

  const dateLabel = yesterday.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const sinceISO = yesterday.toISOString()
  const untilISO = today.toISOString()

  let sent = 0

  for (const profile of profiles) {
    // Get this user's bots
    const { data: bots } = await supabase
      .from('replyee_chatbots')
      .select('id, name')
      .eq('user_id', profile.id)
      .eq('is_active', true)

    if (!bots?.length) continue

    const botIds = bots.map(b => b.id)

    // Visitor sessions yesterday
    const { data: sessions } = await supabase
      .from('replyee_visitor_sessions')
      .select('visitor_id, visits, current_page, referrer')
      .in('chatbot_id', botIds)
      .gte('last_seen', sinceISO)
      .lt('last_seen', untilISO)

    const visitorsTotal = sessions?.length ?? 0
    const visitorsNew = sessions?.filter(s => s.visits === 1).length ?? 0
    const visitorsReturning = visitorsTotal - visitorsNew

    // Top pages
    const pageCount: Record<string, number> = {}
    for (const s of sessions ?? []) {
      if (!s.current_page) continue
      try {
        const path = new URL(s.current_page).pathname
        pageCount[path] = (pageCount[path] ?? 0) + 1
      } catch {
        pageCount[s.current_page] = (pageCount[s.current_page] ?? 0) + 1
      }
    }
    const topPages = Object.entries(pageCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([path, views]) => ({ path, views }))

    // Traffic sources
    const sourceCount: Record<string, number> = {}
    for (const s of sessions ?? []) {
      const src = s.referrer ? (() => {
        try { return new URL(s.referrer).hostname.replace('www.', '') } catch { return 'direct' }
      })() : 'direct'
      sourceCount[src] = (sourceCount[src] ?? 0) + 1
    }
    const sources = Object.entries(sourceCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    // Conversations yesterday
    const { data: convs } = await supabase
      .from('replyee_conversations')
      .select('id, mode')
      .in('chatbot_id', botIds)
      .gte('created_at', sinceISO)
      .lt('created_at', untilISO)

    const conversations = convs?.length ?? 0
    const missedChats = convs?.filter(c => c.mode === 'closed').length ?? 0
    const humanHandoffs = convs?.filter(c => c.mode === 'human').length ?? 0

    // Leads yesterday
    const { count: leadsCount } = await supabase
      .from('replyee_leads')
      .select('id', { count: 'exact', head: true })
      .in('chatbot_id', botIds)
      .gte('created_at', sinceISO)
      .lt('created_at', untilISO)

    const aiResolutionRate = conversations > 0
      ? Math.round(((conversations - humanHandoffs) / conversations) * 100)
      : 100

    await sendDailyReport({
      to: profile.email,
      botName: bots.length === 1 ? bots[0].name : `${bots.length} bots`,
      date: dateLabel,
      visitorsTotal,
      visitorsNew,
      visitorsReturning,
      conversations,
      missedChats,
      leadsCount: leadsCount ?? 0,
      aiResolutionRate,
      triggeredAuto: conversations,
      respondedAuto: conversations - humanHandoffs,
      triggeredManual: humanHandoffs,
      respondedManual: humanHandoffs,
      topPages,
      sources,
    })

    sent++
  }

  return NextResponse.json({ sent, date: dateLabel })
}
