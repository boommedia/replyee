import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Bot, User } from 'lucide-react'

interface Props { params: Promise<{ id: string }> }

export default async function ConversationDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: conversation } = await supabase
    .from('replyee_conversations')
    .select('*, replyee_chatbots!inner(id, name, accent_color, user_id)')
    .eq('id', id)
    .single()

  if (!conversation) notFound()

  const bot = conversation.replyee_chatbots as unknown as { id: string; name: string; accent_color: string; user_id: string }
  if (bot.user_id !== user.id) notFound()

  const { data: messages } = await supabase
    .from('replyee_messages')
    .select('*')
    .eq('session_id', conversation.session_id)
    .order('created_at', { ascending: true })

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/dashboard/conversations" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8B8B99', textDecoration: 'none', fontSize: 13 }}>
          <ArrowLeft size={14} /> Conversations
        </Link>
      </div>

      <div style={{ background: '#141419', border: '1px solid #262631', borderRadius: 14, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 36, height: 36, background: bot.accent_color, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Bot size={17} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#ECECF1' }}>{bot.name}</div>
          <div style={{ fontSize: 12, color: '#8B8B99' }}>
            {new Date(conversation.created_at).toLocaleString()} &nbsp;·&nbsp; {messages?.length ?? 0} messages
            {conversation.visitor_email && <> &nbsp;·&nbsp; <a href={`mailto:${conversation.visitor_email}`} style={{ color: '#f97316' }}>{conversation.visitor_email}</a></>}
          </div>
        </div>
        <Link href={`/dashboard/bots/${bot.id}`} style={{ fontSize: 12, color: '#8b7bf0', textDecoration: 'none' }}>
          View bot →
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages?.map(msg => (
          <div key={msg.id} style={{ display: 'flex', gap: 10, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'assistant' && (
              <div style={{ width: 28, height: 28, background: bot.accent_color, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4 }}>
                <Bot size={13} color="#fff" />
              </div>
            )}
            <div style={{
              maxWidth: '72%',
              background: msg.role === 'user' ? '#141419' : 'rgba(139,123,240,.12)',
              border: `1px solid ${msg.role === 'user' ? '#262631' : 'rgba(139,123,240,.2)'}`,
              borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              padding: '10px 14px',
            }}>
              <p style={{ fontSize: 14, color: '#ECECF1', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
              <div style={{ fontSize: 10, color: '#8B8B99', marginTop: 6, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            {msg.role === 'user' && (
              <div style={{ width: 28, height: 28, background: '#262631', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4 }}>
                <User size={13} color="#8B8B99" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
