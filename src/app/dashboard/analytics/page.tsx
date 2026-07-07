import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BarChart3, MessageCircle, CheckCircle, Clock, Mail } from 'lucide-react'

export const metadata = { title: 'Analytics' }

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bots } = await supabase
    .from('replyee_chatbots')
    .select('id, name, accent_color, conversation_count, lead_count')
    .eq('user_id', user.id)

  const totalConvos = bots?.reduce((s, b) => s + (b.conversation_count ?? 0), 0) ?? 0
  const totalLeads  = bots?.reduce((s, b) => s + (b.lead_count ?? 0), 0) ?? 0

  // Conversations by day (last 30 days)
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recentConvos } = await supabase
    .from('replyee_conversations')
    .select('created_at, chatbot_id')
    .in('chatbot_id', (bots ?? []).map(b => b.id))
    .gte('created_at', since)
    .order('created_at', { ascending: true })

  // Build day buckets for chart
  const dayMap = new Map<string, number>()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    dayMap.set(d.toISOString().slice(0, 10), 0)
  }
  for (const c of recentConvos ?? []) {
    const day = c.created_at.slice(0, 10)
    dayMap.set(day, (dayMap.get(day) ?? 0) + 1)
  }
  const chartData = Array.from(dayMap.entries())
  const maxVal = Math.max(...chartData.map(d => d[1]), 1)

  // Top questions (first user message per conversation)
  const botIds = (bots ?? []).map(b => b.id)
  const { data: topMsgs } = await supabase
    .from('replyee_messages')
    .select('content')
    .eq('role', 'user')
    .in('chatbot_id', botIds)
    .gte('created_at', since)
    .limit(200)

  const wordFreq = new Map<string, number>()
  const stopWords = new Set(['what', 'how', 'is', 'the', 'a', 'an', 'do', 'does', 'can', 'i', 'you', 'my', 'your', 'it', 'for', 'to', 'and', 'or', 'in', 'on', 'at', 'of', 'are', 'be', 'have', 'has', 'with', 'about'])
  for (const msg of topMsgs ?? []) {
    const words = msg.content.toLowerCase().match(/\b[a-z]{4,}\b/g) ?? []
    for (const w of words) {
      if (!stopWords.has(w)) wordFreq.set(w, (wordFreq.get(w) ?? 0) + 1)
    }
  }
  const topWords = Array.from(wordFreq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const maxWordCount = Math.max(...topWords.map(w => w[1]), 1)

  const CARD = { background: '#141419', border: '1px solid #262631', borderRadius: 14, padding: 24 }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-1px', color: '#ECECF1' }}>Analytics</h1>
          <p style={{ fontSize: 14, color: '#8B8B99', marginTop: 4 }}>Last 30 days performance.</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Conversations', value: totalConvos, icon: MessageCircle, color: '#8b7bf0' },
          { label: 'Active Bots', value: bots?.length ?? 0, icon: BarChart3, color: '#a99bf5' },
          { label: 'Leads Captured', value: totalLeads, icon: Mail, color: '#f97316' },
          { label: 'This Month', value: recentConvos?.length ?? 0, icon: Clock, color: '#4ade80' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={CARD}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: '#8B8B99' }}>{label}</span>
              <div style={{ width: 30, height: 30, background: `${color}20`, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={14} style={{ color }} />
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#ECECF1', letterSpacing: '-1px' }}>{value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Conversations chart */}
        <div style={CARD}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#ECECF1', marginBottom: 20 }}>Conversations Per Day (30d)</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 160 }}>
            {chartData.map(([day, count]) => (
              <div key={day} title={`${day}: ${count}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', background: count > 0 ? '#8b7bf0' : 'rgba(139,123,240,.15)', borderRadius: '3px 3px 0 0', height: `${Math.max((count / maxVal) * 100, count > 0 ? 4 : 2)}%`, minHeight: 2 }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#8B8B99', marginTop: 6 }}>
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Top topics */}
        <div style={CARD}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#ECECF1', marginBottom: 20 }}>Top Topics This Month</div>
          {topWords.length === 0 ? (
            <p style={{ color: '#8B8B99', fontSize: 14 }}>Not enough data yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topWords.map(([word, count]) => (
                <div key={word}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: '#ECECF1', textTransform: 'capitalize' }}>{word}</span>
                    <span style={{ color: '#8B8B99' }}>{count}</span>
                  </div>
                  <div style={{ height: 5, background: '#262631', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${(count / maxWordCount) * 100}%`, height: '100%', background: '#8b7bf0', borderRadius: 99 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Per-bot breakdown */}
      {(bots?.length ?? 0) > 1 && (
        <div style={CARD}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#ECECF1', marginBottom: 20 }}>Per-Bot Breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {bots?.map(bot => {
              const pct = totalConvos > 0 ? Math.round((bot.conversation_count / totalConvos) * 100) : 0
              return (
                <div key={bot.id} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 28, height: 28, background: bot.accent_color ?? '#8b7bf0', borderRadius: 6, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                      <span style={{ color: '#ECECF1', fontWeight: 600 }}>{bot.name}</span>
                      <span style={{ color: '#8B8B99' }}>{bot.conversation_count.toLocaleString()} convos &nbsp;·&nbsp; {bot.lead_count} leads</span>
                    </div>
                    <div style={{ height: 5, background: '#262631', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: bot.accent_color ?? '#8b7bf0', borderRadius: 99 }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: '#8B8B99', minWidth: 36, textAlign: 'right' }}>{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!bots?.length && (
        <div style={{ ...CARD, textAlign: 'center', padding: '64px 40px' }}>
          <CheckCircle size={40} style={{ color: '#8B8B99', margin: '0 auto 16px', display: 'block' }} />
          <p style={{ color: '#8B8B99', fontSize: 14 }}>No data yet. Create a chatbot and start getting conversations to see analytics.</p>
        </div>
      )}
    </div>
  )
}
