import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, Bot, DollarSign, MessageCircle, AlertTriangle } from 'lucide-react'

interface SearchParams { section?: string }

export default async function AdminPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { section = 'overview' } = await searchParams

  const supabase  = await createClient()
  const admin     = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'eric@boommedia.us') redirect('/dashboard')

  const [
    { data: profiles },
    { data: allBots },
    { data: recentProfiles },
  ] = await Promise.all([
    admin.from('replyee_profiles').select('id, full_name, email, plan, bot_limit, created_at').order('created_at', { ascending: false }),
    admin.from('replyee_chatbots').select('id, name, accent_color, user_id, conversation_count, lead_count, chunk_count, created_at, is_active').order('created_at', { ascending: false }),
    admin.from('replyee_profiles').select('id, full_name, email, plan, created_at').order('created_at', { ascending: false }).limit(10),
  ])

  const totalUsers  = profiles?.length ?? 0
  const payingUsers = profiles?.filter(p => p.plan !== 'trial' && p.plan !== 'starter_trial').length ?? 0
  const trialUsers  = totalUsers - payingUsers
  const totalBots   = allBots?.length ?? 0
  const totalConvos = allBots?.reduce((s, b) => s + (b.conversation_count ?? 0), 0) ?? 0

  // MRR calc
  const PLAN_PRICES: Record<string, number> = { starter: 25, growth: 49, agency: 99 }
  const mrr = profiles?.reduce((s, p) => s + (PLAN_PRICES[p.plan] ?? 0), 0) ?? 0

  const CARD = { background: '#0d1018', border: '1px solid #1a2035', borderRadius: 14, padding: 24 }

  const planTag = (plan: string) => {
    const colors: Record<string, [string, string]> = {
      starter: ['rgba(100,116,139,.15)', '#64748b'],
      growth:  ['rgba(99,102,241,.15)',  '#6366f1'],
      agency:  ['rgba(34,211,238,.15)',  '#22d3ee'],
    }
    const [bg, color] = colors[plan] ?? ['rgba(249,115,22,.12)', '#f97316']
    return (
      <span style={{ display: 'inline-block', fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 700, background: bg, color, textTransform: 'capitalize' as const }}>
        {plan}
      </span>
    )
  }

  const TABLE_TH = { fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '.08em', padding: '0 12px 12px', borderBottom: '1px solid #1a2035', textAlign: 'left' as const }
  const TABLE_TD = { fontSize: 13, padding: '14px 12px', borderBottom: '1px solid rgba(26,32,53,.5)', verticalAlign: 'middle' as const }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-1px', color: '#e2e8f0' }}>
            {section === 'overview' ? 'Admin Overview'
              : section === 'users' ? 'All Users'
              : section === 'bots' ? 'All Chatbots'
              : section === 'revenue' ? 'Revenue'
              : section === 'usage' ? 'API Usage'
              : 'Alerts'}
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Replyee platform — Boom Media internal</p>
        </div>
      </div>

      {/* ── Overview ── */}
      {section === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'Total Users', value: totalUsers, icon: Users, color: '#6366f1', delta: `${trialUsers} on trial` },
              { label: 'MRR', value: `$${mrr.toLocaleString()}`, icon: DollarSign, color: '#4ade80', delta: `${payingUsers} paying` },
              { label: 'Active Bots', value: totalBots, icon: Bot, color: '#22d3ee', delta: '' },
              { label: 'Total Conversations', value: totalConvos.toLocaleString(), icon: MessageCircle, color: '#f97316', delta: '' },
            ].map(({ label, value, icon: Icon, color, delta }) => (
              <div key={label} style={CARD}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
                  <div style={{ width: 28, height: 28, background: `${color}20`, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={13} style={{ color }} />
                  </div>
                </div>
                <div style={{ fontSize: 30, fontWeight: 900, color: '#e2e8f0', letterSpacing: '-1px' }}>{value}</div>
                {delta && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{delta}</div>}
              </div>
            ))}
          </div>

          {/* Recent signups */}
          <div style={CARD}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>Recent Signups</span>
              <a href="/admin?section=users" style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none' }}>View all →</a>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={TABLE_TH}>User</th>
                  <th style={TABLE_TH}>Plan</th>
                  <th style={TABLE_TH}>Bots</th>
                  <th style={TABLE_TH}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentProfiles?.slice(0, 8).map(p => {
                  const userBots = allBots?.filter(b => b.user_id === p.id) ?? []
                  return (
                    <tr key={p.id}>
                      <td style={TABLE_TD}>
                        <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{p.full_name ?? '—'}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{p.email}</div>
                      </td>
                      <td style={TABLE_TD}>{planTag(p.plan)}</td>
                      <td style={{ ...TABLE_TD, color: '#94a3b8' }}>{userBots.length}</td>
                      <td style={{ ...TABLE_TD, color: '#64748b', fontSize: 12 }}>{new Date(p.created_at).toLocaleDateString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── All Users ── */}
      {section === 'users' && (
        <div style={CARD}>
          <div style={{ marginBottom: 16, fontSize: 14, color: '#64748b' }}>{totalUsers} accounts</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TABLE_TH}>User</th>
                <th style={TABLE_TH}>Plan</th>
                <th style={TABLE_TH}>Bots</th>
                <th style={TABLE_TH}>Conversations</th>
                <th style={TABLE_TH}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {profiles?.map(p => {
                const userBots = allBots?.filter(b => b.user_id === p.id) ?? []
                const convos   = userBots.reduce((s, b) => s + (b.conversation_count ?? 0), 0)
                return (
                  <tr key={p.id} style={{ cursor: 'default' }}>
                    <td style={TABLE_TD}>
                      <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{p.full_name ?? '—'}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{p.email}</div>
                    </td>
                    <td style={TABLE_TD}>{planTag(p.plan)}</td>
                    <td style={{ ...TABLE_TD, color: '#94a3b8' }}>{userBots.length}</td>
                    <td style={{ ...TABLE_TD, color: '#94a3b8' }}>{convos.toLocaleString()}</td>
                    <td style={{ ...TABLE_TD, color: '#64748b', fontSize: 12 }}>{new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── All Bots ── */}
      {section === 'bots' && (
        <div style={CARD}>
          <div style={{ marginBottom: 16, fontSize: 14, color: '#64748b' }}>{totalBots} chatbots</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TABLE_TH}>Bot</th>
                <th style={TABLE_TH}>Owner</th>
                <th style={TABLE_TH}>Chunks</th>
                <th style={TABLE_TH}>Conversations</th>
                <th style={TABLE_TH}>Leads</th>
                <th style={TABLE_TH}>Created</th>
              </tr>
            </thead>
            <tbody>
              {allBots?.map(bot => {
                const owner = profiles?.find(p => p.id === bot.user_id)
                return (
                  <tr key={bot.id}>
                    <td style={TABLE_TD}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 26, height: 26, background: bot.accent_color ?? '#6366f1', borderRadius: 6, flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{bot.name}</span>
                      </div>
                    </td>
                    <td style={{ ...TABLE_TD, color: '#64748b', fontSize: 12 }}>{owner?.email ?? '—'}</td>
                    <td style={{ ...TABLE_TD, color: '#94a3b8' }}>{bot.chunk_count}</td>
                    <td style={{ ...TABLE_TD, color: '#94a3b8' }}>{bot.conversation_count.toLocaleString()}</td>
                    <td style={{ ...TABLE_TD, color: '#94a3b8' }}>{bot.lead_count}</td>
                    <td style={{ ...TABLE_TD, color: '#64748b', fontSize: 12 }}>{new Date(bot.created_at).toLocaleDateString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Revenue ── */}
      {section === 'revenue' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'MRR', value: `$${mrr.toLocaleString()}`, color: '#4ade80' },
              { label: 'ARR (projected)', value: `$${(mrr * 12).toLocaleString()}`, color: '#6366f1' },
              { label: 'Paying Users', value: payingUsers, color: '#22d3ee' },
            ].map(({ label, value, color }) => (
              <div key={label} style={CARD}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{label}</div>
                <div style={{ fontSize: 32, fontWeight: 900, color, letterSpacing: '-1px' }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={CARD}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 20 }}>Plan Distribution</div>
            {(['agency', 'growth', 'starter'] as const).map(plan => {
              const count = profiles?.filter(p => p.plan === plan).length ?? 0
              const rev   = count * (PLAN_PRICES[plan] ?? 0)
              const pct   = mrr > 0 ? Math.round((rev / mrr) * 100) : 0
              return (
                <div key={plan} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: '#e2e8f0', textTransform: 'capitalize' }}>{plan} <span style={{ color: '#64748b' }}>${PLAN_PRICES[plan]}/mo</span></span>
                    <span style={{ color: '#64748b' }}>{count} users · ${rev.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 6, background: '#1a2035', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: plan === 'agency' ? '#22d3ee' : plan === 'growth' ? '#6366f1' : '#64748b', borderRadius: 99 }} />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── API Usage ── */}
      {section === 'usage' && (
        <div style={CARD}>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            API usage tracking (Claude + OpenAI) coming soon. Connect to your Anthropic and OpenAI dashboards for current spend.
          </p>
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a href="https://console.anthropic.com/usage" target="_blank" rel="noreferrer" style={{ fontSize: 14, color: '#6366f1' }}>→ Anthropic Console Usage</a>
            <a href="https://platform.openai.com/usage" target="_blank" rel="noreferrer" style={{ fontSize: 14, color: '#6366f1' }}>→ OpenAI Platform Usage</a>
            <a href="https://dashboard.stripe.com" target="_blank" rel="noreferrer" style={{ fontSize: 14, color: '#6366f1' }}>→ Stripe Dashboard</a>
          </div>
        </div>
      )}

      {/* ── Alerts ── */}
      {section === 'alerts' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: 'rgba(99,102,241,.06)', border: '1px solid rgba(99,102,241,.2)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <AlertTriangle size={18} style={{ color: '#6366f1', flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>Admin alerts will appear here</div>
              <p style={{ fontSize: 13, color: '#64748b' }}>
                Future: payment failures, trial expirations, high-usage accounts, and system health alerts.
              </p>
            </div>
          </div>
          {trialUsers > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: 'rgba(249,115,22,.06)', border: '1px solid rgba(249,115,22,.2)', borderRadius: 12, padding: 16 }}>
              <AlertTriangle size={18} style={{ color: '#f97316', flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>
                  {trialUsers} users currently on trial
                </div>
                <p style={{ fontSize: 13, color: '#64748b' }}>
                  Review trial users in the All Users tab and consider sending a conversion nudge.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
