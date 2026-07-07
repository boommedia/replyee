import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Bot, Plus, MessageCircle, Mail, Code2, ArrowRight } from 'lucide-react'

export default async function BotsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: bots } = await supabase
    .from('replyee_chatbots')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-1px', color: '#ECECF1' }}>My Chatbots</h1>
          <p style={{ fontSize: 14, color: '#8B8B99', marginTop: 4 }}>Manage your AI chatbots and their knowledge bases.</p>
        </div>
        <Link href="/dashboard/bots/new" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#8b7bf0', color: '#fff', fontWeight: 700, fontSize: 13, padding: '10px 20px', borderRadius: 8, textDecoration: 'none' }}>
          <Plus size={15} /> New Chatbot
        </Link>
      </div>

      {bots && bots.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {bots.map(bot => (
            <div key={bot.id} style={{ background: '#141419', border: '1px solid #262631', borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, background: bot.accent_color ?? '#8b7bf0', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={20} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#ECECF1' }}>{bot.name}</div>
                  <div style={{ fontSize: 12, color: '#8B8B99' }}>{bot.website_url ?? 'No website set'}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  [MessageCircle, bot.conversation_count ?? 0, 'Chats'],
                  [Mail, bot.lead_count ?? 0, 'Leads'],
                  [Code2, bot.chunk_count ?? 0, 'Chunks'],
                ].map(([Icon, val, lbl]) => (
                  <div key={lbl as string} style={{ background: '#0B0B0F', border: '1px solid #262631', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                    <Icon size={14} style={{ color: '#8b7bf0', margin: '0 auto 4px' }} />
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#ECECF1' }}>{String(val)}</div>
                    <div style={{ fontSize: 10, color: '#8B8B99' }}>{String(lbl)}</div>
                  </div>
                ))}
              </div>

              <Link href={`/dashboard/bots/${bot.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'transparent', color: '#8b7bf0', border: '1px solid rgba(139,123,240,0.3)', fontWeight: 600, fontSize: 13, padding: '10px', borderRadius: 8, textDecoration: 'none' }}>
                Manage Bot <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: '#141419', border: '1px dashed #262631', borderRadius: 16, padding: '64px 40px', textAlign: 'center' }}>
          <Bot size={40} style={{ color: '#8b7bf0', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#ECECF1', marginBottom: 8 }}>No chatbots yet</h2>
          <p style={{ color: '#8B8B99', fontSize: 14, marginBottom: 24 }}>Create your first chatbot and train it on your content in minutes.</p>
          <Link href="/dashboard/bots/new" style={{ background: '#8b7bf0', color: '#fff', fontWeight: 700, fontSize: 14, padding: '12px 28px', borderRadius: 8, textDecoration: 'none', display: 'inline-block' }}>
            + Create Your First Chatbot
          </Link>
        </div>
      )}
    </div>
  )
}
