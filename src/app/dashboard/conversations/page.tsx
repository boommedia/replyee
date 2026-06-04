import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'

export const metadata = { title: 'Conversations' }

interface SearchParams { bot?: string }

export default async function ConversationsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { bot: botFilter } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bots } = await supabase
    .from('replyee_chatbots')
    .select('id, name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  let query = supabase
    .from('replyee_conversations')
    .select(`
      id, session_id, created_at, updated_at, visitor_email,
      replyee_chatbots!inner(id, name, user_id)
    `)
    .eq('replyee_chatbots.user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(100)

  if (botFilter) {
    query = query.eq('chatbot_id', botFilter)
  }

  const { data: conversations } = await query

  const { data: firstMessages } = await supabase
    .from('replyee_messages')
    .select('session_id, content')
    .eq('role', 'user')
    .in('session_id', (conversations ?? []).map(c => c.session_id))
    .order('created_at', { ascending: true })

  const previewMap = new Map<string, string>()
  for (const m of firstMessages ?? []) {
    if (!previewMap.has(m.session_id)) previewMap.set(m.session_id, m.content)
  }

  const { data: msgCounts } = await supabase
    .from('replyee_messages')
    .select('session_id')
    .in('session_id', (conversations ?? []).map(c => c.session_id))

  const countMap = new Map<string, number>()
  for (const m of msgCounts ?? []) {
    countMap.set(m.session_id, (countMap.get(m.session_id) ?? 0) + 1)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-1px', color: '#e2e8f0' }}>Conversations</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Full history of all chatbot interactions.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link
            href="/dashboard/conversations"
            style={{ fontSize: 12, padding: '6px 14px', borderRadius: 99, border: '1px solid', borderColor: !botFilter ? '#6366f1' : '#1a2035', background: !botFilter ? 'rgba(99,102,241,.1)' : 'transparent', color: !botFilter ? '#6366f1' : '#64748b', textDecoration: 'none', fontWeight: 600 }}
          >
            All
          </Link>
          {bots?.map(b => (
            <Link
              key={b.id}
              href={`/dashboard/conversations?bot=${b.id}`}
              style={{ fontSize: 12, padding: '6px 14px', borderRadius: 99, border: '1px solid', borderColor: botFilter === b.id ? '#6366f1' : '#1a2035', background: botFilter === b.id ? 'rgba(99,102,241,.1)' : 'transparent', color: botFilter === b.id ? '#6366f1' : '#64748b', textDecoration: 'none', fontWeight: 600 }}
            >
              {b.name}
            </Link>
          ))}
        </div>
      </div>

      {!conversations?.length ? (
        <div style={{ background: '#0d1018', border: '1px dashed #1a2035', borderRadius: 16, padding: '64px 40px', textAlign: 'center' }}>
          <MessageCircle size={40} style={{ color: '#6366f1', margin: '0 auto 16px', display: 'block' }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>No conversations yet</h2>
          <p style={{ color: '#64748b', fontSize: 14 }}>Embed your chatbot on a website to start getting conversations.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {conversations.map(c => {
            const bot = c.replyee_chatbots as { id: string; name: string } | null
            const preview = previewMap.get(c.session_id)
            const msgCount = countMap.get(c.session_id) ?? 0
            return (
              <Link
                key={c.id}
                href={`/dashboard/conversations/${c.id}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#0d1018', border: '1px solid #1a2035', borderRadius: 10, textDecoration: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  <MessageCircle size={16} style={{ color: '#22d3ee', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {preview ? `"${preview.slice(0, 80)}${preview.length > 80 ? '…' : ''}"` : 'No messages'}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      {bot?.name ?? 'Unknown bot'} &nbsp;·&nbsp; {msgCount} messages &nbsp;·&nbsp; {new Date(c.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {c.visitor_email && (
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'rgba(249,115,22,.1)', color: '#f97316', fontWeight: 700, marginLeft: 12, flexShrink: 0 }}>
                    Lead
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
