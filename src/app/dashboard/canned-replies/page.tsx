'use client'

import { useEffect, useState } from 'react'
import { Trash2, Plus } from 'lucide-react'

interface CannedReply {
  id: string
  shortcut: string
  body: string
  created_at: string
}

export default function CannedRepliesPage() {
  const [replies, setReplies] = useState<CannedReply[]>([])
  const [loading, setLoading] = useState(true)
  const [shortcut, setShortcut] = useState('')
  const [body, setBody] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchReplies = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/canned-replies')
      const data = await res.json()
      if (data.replies) setReplies(data.replies)
    } catch (err) {
      console.error('Failed to fetch canned replies:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReplies()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shortcut.trim() || !body.trim()) return

    setCreating(true)
    try {
      const res = await fetch('/api/canned-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shortcut, body }),
      })
      if (res.ok) {
        setShortcut('')
        setBody('')
        await fetchReplies()
      }
    } catch (err) {
      console.error('Failed to create canned reply:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this canned reply?')) return
    try {
      const res = await fetch(`/api/canned-replies/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setReplies(replies.filter(r => r.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete canned reply:', err)
    }
  }

  const CARD = { background: '#141419', border: '1px solid #262631', borderRadius: 14, padding: 24 }
  const INPUT = { background: '#0a0c12', border: '1px solid #262631', borderRadius: 8, padding: '10px 12px', color: '#ECECF1', outline: 'none', fontFamily: 'inherit' }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-1px', color: '#ECECF1' }}>Canned Replies</h1>
          <p style={{ fontSize: 14, color: '#8B8B99', marginTop: 4 }}>Agent shortcuts for common responses.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
        {/* Add form */}
        <div style={CARD}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#ECECF1', marginBottom: 16 }}>Add Canned Reply</h2>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="text"
              placeholder="Shortcut (e.g., /hours)"
              value={shortcut}
              onChange={e => setShortcut(e.target.value)}
              style={{ ...INPUT, width: '100%' } as React.CSSProperties}
              required
            />
            <textarea
              placeholder="Response body"
              value={body}
              onChange={e => setBody(e.target.value)}
              style={{ ...INPUT, width: '100%', minHeight: 120, resize: 'none' } as React.CSSProperties}
              required
            />
            <button
              type="submit"
              disabled={creating}
              style={{
                background: '#8b7bf0',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 16px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
                opacity: creating ? 0.6 : 1,
              }}
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </form>
        </div>

        {/* List */}
        <div style={CARD}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#ECECF1', marginBottom: 16 }}>Your Replies</h2>
          {loading ? (
            <p style={{ color: '#8B8B99', fontSize: 13 }}>Loading...</p>
          ) : replies.length === 0 ? (
            <p style={{ color: '#8B8B99', fontSize: 13 }}>No canned replies yet. Create one to get started!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {replies.map(r => (
                <div key={r.id} style={{ background: '#0a0c12', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ color: '#8b7bf0', fontWeight: 700, fontSize: 12 }}>{r.shortcut}</div>
                    <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4, lineHeight: 1.4, maxWidth: 200 }}>{r.body}</div>
                  </div>
                  <button
                    onClick={() => handleDelete(r.id)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8B8B99', padding: 4 }}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
