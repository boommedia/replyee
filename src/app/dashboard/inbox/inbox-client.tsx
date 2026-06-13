'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { Bot as BotIcon, User, Headset, Send, MessagesSquare, RotateCcw, XCircle } from 'lucide-react'

interface Bot { id: string; name: string; accent_color: string }
interface Conversation {
  id: string
  session_id: string
  chatbot_id: string
  mode: string
  unread_by_agent: number
  last_message_at: string | null
  updated_at: string
  visitor_email: string | null
}
interface Message {
  id: string
  session_id: string
  role: 'user' | 'assistant' | 'agent'
  content: string
  created_at: string
}

const MODE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  bot:    { label: 'Bot',    color: '#22d3ee', bg: 'rgba(34,211,238,.1)' },
  human:  { label: 'Live',   color: '#4ade80', bg: 'rgba(74,222,128,.12)' },
  closed: { label: 'Closed', color: '#64748b', bg: 'rgba(100,116,139,.12)' },
}

export default function InboxClient({ bots }: { bots: Bot[] }) {
  const supabase = useRef(createClient()).current
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const sessionChannel = useRef<RealtimeChannel | null>(null)
  const messagesEnd = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<Conversation | null>(null)
  selectedRef.current = selected

  const botMap = new Map(bots.map(b => [b.id, b]))
  const botIds = bots.map(b => b.id)

  const loadConversations = useCallback(async () => {
    if (botIds.length === 0) return
    const { data } = await supabase
      .from('replyee_conversations')
      .select('id, session_id, chatbot_id, mode, unread_by_agent, last_message_at, updated_at, visitor_email')
      .in('chatbot_id', botIds)
      .neq('mode', 'closed')
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(50)
    setConversations((data ?? []) as Conversation[])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase])

  // Initial load + realtime: refresh on any new message for my bots (RLS-scoped)
  useEffect(() => {
    loadConversations()
    const channel = supabase
      .channel('inbox-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'replyee_messages' }, payload => {
        const msg = payload.new as Message
        loadConversations()
        const sel = selectedRef.current
        if (sel && msg.session_id === sel.session_id) {
          setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'replyee_conversations' }, () => {
        loadConversations()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, loadConversations])

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Broadcast channel to the visitor's widget for the selected session
  function joinSessionChannel(sessionId: string) {
    if (sessionChannel.current) supabase.removeChannel(sessionChannel.current)
    sessionChannel.current = supabase.channel(`replyee-session-${sessionId}`)
    sessionChannel.current.subscribe()
  }

  async function selectConversation(c: Conversation) {
    setSelected(c)
    setMessages([])
    joinSessionChannel(c.session_id)
    const { data } = await supabase
      .from('replyee_messages')
      .select('id, session_id, role, content, created_at')
      .eq('session_id', c.session_id)
      .order('created_at', { ascending: true })
      .limit(200)
    setMessages((data ?? []) as Message[])
    if (c.unread_by_agent > 0) {
      await supabase.from('replyee_conversations').update({ unread_by_agent: 0 }).eq('id', c.id)
    }
  }

  async function setMode(c: Conversation, mode: 'bot' | 'human' | 'closed') {
    await supabase.from('replyee_conversations').update({ mode }).eq('id', c.id)
    setSelected(prev => prev && prev.id === c.id ? { ...prev, mode } : prev)
    sessionChannel.current?.send({
      type: 'broadcast',
      event: 'mode',
      payload: { mode },
    })
    loadConversations()
  }

  async function sendReply() {
    if (!selected || !reply.trim() || sending) return
    const content = reply.trim()
    setSending(true)
    setReply('')
    try {
      if (selected.mode !== 'human') await setMode(selected, 'human')
      const { data, error } = await supabase
        .from('replyee_messages')
        .insert({ session_id: selected.session_id, chatbot_id: selected.chatbot_id, role: 'agent', content })
        .select('id, session_id, role, content, created_at')
        .single()
      if (error) throw error
      setMessages(prev => prev.some(m => m.id === data.id) ? prev : [...prev, data as Message])
      await supabase.from('replyee_conversations')
        .update({ last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', selected.id)
      // Push instantly to the visitor's widget
      sessionChannel.current?.send({
        type: 'broadcast',
        event: 'agent_message',
        payload: { content },
      })
    } catch (err) {
      console.error('[inbox] send failed', err)
      setReply(content)
    } finally {
      setSending(false)
    }
  }

  const panel = { background: '#0d1018', border: '1px solid #1a2035', borderRadius: 14 }

  if (bots.length === 0) {
    return (
      <div style={{ ...panel, padding: '64px 40px', textAlign: 'center' }}>
        <MessagesSquare size={40} style={{ color: '#6366f1', margin: '0 auto 16px', display: 'block' }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>No chatbots yet</h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>Create a chatbot first — live conversations will appear here.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, height: 'calc(100vh - 210px)', minHeight: 420 }}>
      {/* Conversation list */}
      <div style={{ ...panel, overflowY: 'auto' }}>
        {conversations.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: 13, padding: 20, textAlign: 'center' }}>
            No active conversations. They appear here the moment a visitor messages one of your bots.
          </p>
        ) : conversations.map(c => {
          const badge = MODE_BADGE[c.mode] ?? MODE_BADGE.bot
          const bot = botMap.get(c.chatbot_id)
          const active = selected?.id === c.id
          return (
            <button
              key={c.id}
              onClick={() => selectConversation(c)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '12px 14px',
                background: active ? 'rgba(99,102,241,.08)' : 'transparent',
                border: 'none', borderBottom: '1px solid #1a2035',
                borderLeft: active ? '2px solid #6366f1' : '2px solid transparent', cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, color: badge.color, background: badge.bg }}>
                  {badge.label}
                </span>
                <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {bot?.name ?? 'Bot'}
                </span>
                {c.unread_by_agent > 0 && (
                  <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, minWidth: 18, height: 18, borderRadius: 9, background: '#ef4444', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                    {c.unread_by_agent}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                {c.visitor_email ?? 'Anonymous visitor'} · {c.last_message_at ? new Date(c.last_message_at).toLocaleString() : new Date(c.updated_at).toLocaleString()}
              </div>
            </button>
          )
        })}
      </div>

      {/* Transcript + reply */}
      <div style={{ ...panel, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
            <Headset size={36} style={{ color: '#6366f1' }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>Select a conversation to view and reply</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid #1a2035', flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', flex: 1, minWidth: 0 }}>
                {botMap.get(selected.chatbot_id)?.name ?? 'Bot'} · {selected.visitor_email ?? 'Anonymous visitor'}
              </div>
              {selected.mode !== 'human' ? (
                <button onClick={() => setMode(selected, 'human')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer' }}>
                  <Headset size={13} /> Take over
                </button>
              ) : (
                <button onClick={() => setMode(selected, 'bot')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 8, border: '1px solid #1a2035', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}>
                  <RotateCcw size={13} /> Release to bot
                </button>
              )}
              <button onClick={() => { setMode(selected, 'closed'); setSelected(null) }} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, padding: '7px 12px', borderRadius: 8, border: '1px solid #1a2035', background: 'transparent', color: '#64748b', cursor: 'pointer' }}>
                <XCircle size={13} /> Close
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.map(m => {
                const mine = m.role !== 'user'
                const isAgent = m.role === 'agent'
                return (
                  <div key={m.id} style={{ display: 'flex', gap: 8, justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                    {!mine && (
                      <div style={{ width: 26, height: 26, background: '#1a2035', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 3 }}>
                        <User size={12} color="#64748b" />
                      </div>
                    )}
                    <div style={{
                      maxWidth: '70%',
                      background: !mine ? '#11151f' : isAgent ? 'rgba(74,222,128,.1)' : 'rgba(99,102,241,.12)',
                      border: `1px solid ${!mine ? '#1a2035' : isAgent ? 'rgba(74,222,128,.25)' : 'rgba(99,102,241,.2)'}`,
                      borderRadius: mine ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      padding: '9px 13px',
                    }}>
                      <p style={{ fontSize: 13, color: '#e2e8f0', margin: 0, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{m.content}</p>
                      <div style={{ fontSize: 10, color: '#64748b', marginTop: 5, textAlign: mine ? 'right' : 'left' }}>
                        {isAgent ? 'You' : m.role === 'assistant' ? 'AI' : 'Visitor'} · {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {mine && (
                      <div style={{ width: 26, height: 26, background: isAgent ? 'rgba(74,222,128,.15)' : 'rgba(99,102,241,.2)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 3 }}>
                        {isAgent ? <Headset size={12} color="#4ade80" /> : <BotIcon size={12} color="#6366f1" />}
                      </div>
                    )}
                  </div>
                )
              })}
              <div ref={messagesEnd} />
            </div>

            <div style={{ display: 'flex', gap: 8, padding: '12px 14px', borderTop: '1px solid #1a2035', flexShrink: 0 }}>
              <input
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                placeholder={selected.mode === 'human' ? 'Reply to the visitor…' : 'Type to take over from the bot…'}
                style={{ flex: 1, background: '#11151f', border: '1px solid #1a2035', borderRadius: 8, padding: '10px 13px', fontSize: 13, color: '#e2e8f0', outline: 'none' }}
              />
              <button
                onClick={sendReply}
                disabled={sending || !reply.trim()}
                style={{ width: 40, borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', cursor: sending ? 'default' : 'pointer', opacity: sending || !reply.trim() ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="Send reply"
              >
                <Send size={15} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
