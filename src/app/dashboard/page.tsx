import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Bot, MessageCircle, Mail, Plus, ArrowRight, Zap } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: bots }, { data: recentConvos }] = await Promise.all([
    supabase.from('replyee_chatbots').select('id, name, accent_color, conversation_count, lead_count').eq('user_id', user!.id).order('created_at', { ascending: false }),
    supabase.from('replyee_conversations').select('id, chatbot_id, created_at, replyee_chatbots(name)').eq('replyee_chatbots.user_id', user!.id).order('created_at', { ascending: false }).limit(5),
  ])

  const totalConvos = bots?.reduce((sum, b) => sum + (b.conversation_count ?? 0), 0) ?? 0
  const totalLeads  = bots?.reduce((sum, b) => sum + (b.lead_count ?? 0), 0) ?? 0

  const STATS = [
    { label: 'Active Chatbots', value: bots?.length ?? 0, icon: Bot,           color: '#6366f1' },
    { label: 'Total Conversations', value: totalConvos,   icon: MessageCircle, color: '#22d3ee' },
    { label: 'Leads Captured',      value: totalLeads,    icon: Mail,          color: '#4ade80' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-1px', color: '#e2e8f0' }}>Dashboard</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Overview of your chatbots and conversations.</p>
        </div>
        <Link href="/dashboard/bots/new" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: 13, padding: '10px 20px', borderRadius: 8, textDecoration: 'none' }}>
          <Plus size={15} /> New Chatbot
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {STATS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ background: '#0d1018', border: '1px solid #1a2035', borderRadius: 14, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{label}</span>
              <div style={{ width: 32, height: 32, background: `${color}20`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} style={{ color }} />
              </div>
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-1.5px', color: '#e2e8f0' }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ background: '#0d1018', border: '1px solid #1a2035', borderRadius: 14, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>Your Chatbots</h2>
            <Link href="/dashboard/bots" style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none' }}>View all →</Link>
          </div>
          {bots && bots.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {bots.slice(0, 4).map(bot => (
                <Link key={bot.id} href={`/dashboard/bots/${bot.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: '#07080f', borderRadius: 10, border: '1px solid #1a2035', textDecoration: 'none' }}>
                  <div style={{ width: 32, height: 32, background: bot.accent_color ?? '#6366f1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={16} color="#fff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{bot.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{bot.conversation_count ?? 0} conversations</div>
                  </div>
                  <ArrowRight size={14} style={{ color: '#64748b' }} />
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <Zap size={32} style={{ color: '#6366f1', margin: '0 auto 12px' }} />
              <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>No chatbots yet. Create your first one.</p>
              <Link href="/dashboard/bots/new" style={{ background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: 13, padding: '10px 20px', borderRadius: 8, textDecoration: 'none', display: 'inline-block' }}>
                + Create Chatbot
              </Link>
            </div>
          )}
        </div>

        <div style={{ background: '#0d1018', border: '1px solid #1a2035', borderRadius: 14, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>Recent Conversations</h2>
            <Link href="/dashboard/conversations" style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none' }}>View all →</Link>
          </div>
          {recentConvos && recentConvos.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentConvos.map(c => (
                <Link key={c.id} href={`/dashboard/conversations/${c.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#07080f', borderRadius: 10, border: '1px solid #1a2035', textDecoration: 'none' }}>
                  <MessageCircle size={14} style={{ color: '#22d3ee', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 500 }}>
                      {(c.replyee_chatbots as unknown as { name: string } | null)?.name ?? 'Unknown bot'}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 20px', color: '#64748b', fontSize: 14 }}>
              No conversations yet. Share your bot embed code to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
