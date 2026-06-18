'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users } from 'lucide-react'

interface Visitor {
  id: string
  visitor_id: string
  chatbot_id: string
  current_page: string
  referrer: string
  device: string
  page_views: number
  visits: number
  score: number
  last_seen: string
  session_id: string | null
}

interface Bot {
  id: string
  name: string
  accent_color: string
}

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [bots, setBots] = useState<Map<string, Bot>>(new Map())
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      // Get user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get bots
      const { data: botList } = await supabase
        .from('replyee_chatbots')
        .select('id, name, accent_color')
        .eq('user_id', user.id)

      const botMap = new Map()
      if (botList) {
        botList.forEach(b => botMap.set(b.id, b))
      }
      setBots(botMap)

      // Get initial visitor sessions (last 5 minutes)
      const since = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      const { data: initialVisitors } = await supabase
        .from('replyee_visitor_sessions')
        .select('*')
        .in('chatbot_id', botList?.map(b => b.id) || [])
        .gte('last_seen', since)
        .order('last_seen', { ascending: false })

      if (initialVisitors) {
        setVisitors(initialVisitors)
      }
      setLoading(false)

      // Subscribe to realtime updates
      if (botList && botList.length > 0) {
        const channel = supabase
          .channel('visitors')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'replyee_visitor_sessions',
              filter: `chatbot_id=in.(${botList.map(b => `"${b.id}"`).join(',')})`,
            },
            (payload) => {
              if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                setVisitors(prev => {
                  const existing = prev.findIndex(v => v.id === payload.new.id)
                  if (existing >= 0) {
                    const updated = [...prev]
                    updated[existing] = payload.new
                    return updated.sort((a, b) =>
                      new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime()
                    )
                  }
                  return [payload.new, ...prev].sort((a, b) =>
                    new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime()
                  )
                })
              } else if (payload.eventType === 'DELETE') {
                setVisitors(prev => prev.filter(v => v.id !== payload.old.id))
              }
            }
          )
          .subscribe()

        return () => {
          supabase.removeChannel(channel)
        }
      }
    }

    init()
  }, [supabase])

  const CARD = { background: '#0d1018', border: '1px solid #1a2035', borderRadius: 14, padding: 24 }
  const now = Date.now()
  const liveCount = visitors.filter(v => now - new Date(v.last_seen).getTime() < 5 * 60 * 1000).length

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const mins = Math.floor((now - date.getTime()) / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  const formatUrl = (url: string) => {
    try {
      const u = new URL(url)
      return u.pathname || '/'
    } catch {
      return url
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-1px', color: '#e2e8f0' }}>Visitors</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
            {liveCount} active in the last 5 minutes
          </p>
        </div>
        <Users size={32} color="#6366f1" />
      </div>

      <div style={CARD}>
        {loading ? (
          <p style={{ color: '#64748b' }}>Loading visitors...</p>
        ) : visitors.length === 0 ? (
          <p style={{ color: '#64748b' }}>No recent visitors.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1a2035' }}>
                  <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8', fontWeight: 600 }}>Bot</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8', fontWeight: 600 }}>Page</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8', fontWeight: 600 }}>Views</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8', fontWeight: 600 }}>Visits</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8', fontWeight: 600 }}>Device</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8', fontWeight: 600 }}>Last Seen</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94a3b8', fontWeight: 600 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {visitors.map(v => {
                  const bot = bots.get(v.chatbot_id)
                  return (
                    <tr key={v.id} style={{ borderBottom: '1px solid #1a2035', color: '#e2e8f0' }}>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ fontSize: 12, color: '#6366f1', fontWeight: 600 }}>
                          {bot?.name || 'Unknown'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span title={v.current_page}>{formatUrl(v.current_page)}</span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>{v.page_views}</td>
                      <td style={{ padding: '12px 8px' }}>{v.visits}</td>
                      <td style={{ padding: '12px 8px', textTransform: 'capitalize' }}>{v.device}</td>
                      <td style={{ padding: '12px 8px', color: '#94a3b8' }}>{formatTime(v.last_seen)}</td>
                      <td style={{ padding: '12px 8px' }}>
                        {v.session_id ? (
                          <button
                            style={{
                              background: '#6366f1',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 6,
                              padding: '6px 12px',
                              cursor: 'pointer',
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                            onClick={() => router.push('/dashboard/inbox')}
                          >
                            View Chat
                          </button>
                        ) : (
                          <span style={{ fontSize: 12, color: '#475569' }}>Browsing</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
