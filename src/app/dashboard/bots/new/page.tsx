'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Bot } from 'lucide-react'

const COLORS = ['#6366f1', '#22d3ee', '#4ade80', '#f97316', '#f43f5e', '#a855f7', '#eab308', '#14b8a6']

export default function NewBotPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    website_url: '',
    accent_color: '#6366f1',
    greeting_message: 'Hi! How can I help you today?',
    fallback_message: "I don't have that information. Can I take your email so someone can follow up?",
    system_prompt: '',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Bot name is required'); return }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data, error: err } = await supabase
      .from('chatbots')
      .insert({ ...form, user_id: user.id })
      .select('id')
      .single()

    if (err) { setError(err.message); setLoading(false); return }
    router.push(`/dashboard/bots/${data.id}`)
  }

  const S = {
    label: { fontSize: 13, fontWeight: 600 as const, color: '#cbd5e1', display: 'block' as const, marginBottom: 6 },
    input: { width: '100%', background: '#07080f', border: '1px solid #1a2035', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#e2e8f0', outline: 'none' },
    group: { marginBottom: 20 },
    hint: { fontSize: 12, color: '#64748b', marginTop: 5 },
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <Link href="/dashboard/bots" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', textDecoration: 'none', fontSize: 13 }}>
          <ArrowLeft size={14} /> Back to bots
        </Link>
      </div>

      <div style={{ maxWidth: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, background: form.accent_color, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', color: '#e2e8f0' }}>
              {form.name || 'New Chatbot'}
            </h1>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Configure your bot — you can change everything later.</p>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 20 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ background: '#0d1018', border: '1px solid #1a2035', borderRadius: 14, padding: 28, marginTop: 24 }}>
          <div style={S.group}>
            <label style={S.label}>Bot Name *</label>
            <input style={S.input} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Acme Support Bot" required />
            <p style={S.hint}>This is what visitors will see in the chat header.</p>
          </div>

          <div style={S.group}>
            <label style={S.label}>Website URL</label>
            <input style={S.input} value={form.website_url} onChange={e => set('website_url', e.target.value)} placeholder="https://yourwebsite.com" type="url" />
            <p style={S.hint}>Optional — helps us contextualise your bot.</p>
          </div>

          <div style={S.group}>
            <label style={S.label}>Accent Color</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              {COLORS.map(c => (
                <button
                  key={c} type="button"
                  onClick={() => set('accent_color', c)}
                  style={{
                    width: 32, height: 32, borderRadius: 8, background: c, border: 'none', cursor: 'pointer',
                    outline: form.accent_color === c ? '3px solid #fff' : 'none',
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>
            <input style={{ ...S.input, fontFamily: 'monospace', width: 140 }} value={form.accent_color} onChange={e => set('accent_color', e.target.value)} />
          </div>

          <div style={S.group}>
            <label style={S.label}>Greeting Message</label>
            <input style={S.input} value={form.greeting_message} onChange={e => set('greeting_message', e.target.value)} placeholder="Hi! How can I help you today?" />
            <p style={S.hint}>The first message visitors see when they open the chat.</p>
          </div>

          <div style={S.group}>
            <label style={S.label}>Fallback Message</label>
            <input style={S.input} value={form.fallback_message} onChange={e => set('fallback_message', e.target.value)} />
            <p style={S.hint}>Shown when the bot can't answer a question.</p>
          </div>

          <div style={S.group}>
            <label style={S.label}>System Prompt <span style={{ color: '#64748b', fontWeight: 400 }}>(optional)</span></label>
            <textarea
              style={{ ...S.input, resize: 'vertical', minHeight: 100 }}
              value={form.system_prompt}
              onChange={e => set('system_prompt', e.target.value)}
              placeholder="You are a helpful support assistant for [Company]. Be friendly and concise..."
            />
            <p style={S.hint}>Custom instructions for the AI. Leave blank for sensible defaults.</p>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              type="submit"
              disabled={loading}
              style={{ background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: 14, padding: '12px 28px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Creating…' : 'Create Chatbot →'}
            </button>
            <Link href="/dashboard/bots" style={{ display: 'flex', alignItems: 'center', color: '#64748b', fontSize: 14, textDecoration: 'none' }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
