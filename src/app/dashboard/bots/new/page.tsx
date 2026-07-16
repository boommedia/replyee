'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Bot } from 'lucide-react'

const COLORS = ['#8b7bf0', '#a99bf5', '#4ade80', '#f97316', '#f43f5e', '#a855f7', '#eab308', '#14b8a6']

export default function NewBotPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    website_url: '',
    accent_color: '#8b7bf0',
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
      .from('replyee_chatbots')
      .insert({ ...form, user_id: user.id })
      .select('id')
      .single()

    if (err) { setError(err.message); setLoading(false); return }
    router.push(`/dashboard/bots/${data.id}`)
  }

  const S = {
    label: { fontSize: 13, fontWeight: 600 as const, color: '#cbd5e1', display: 'block' as const, marginBottom: 6 },
    input: { width: '100%', background: '#0B0B0F', border: '1px solid #262631', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#ECECF1', outline: 'none' },
    group: { marginBottom: 20 },
    hint: { fontSize: 12, color: '#8B8B99', marginTop: 5 },
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <Link href="/dashboard/bots" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8B8B99', textDecoration: 'none', fontSize: 13 }}>
          <ArrowLeft size={14} /> Back to bots
        </Link>
      </div>

      <div style={{ maxWidth: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, background: form.accent_color, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', color: '#ECECF1' }}>
              {form.name || 'New Chatbot'}
            </h1>
            <p style={{ fontSize: 13, color: '#8B8B99', marginTop: 2 }}>Configure your bot — you can change everything later.</p>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 20 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ background: '#141419', border: '1px solid #262631', borderRadius: 14, padding: 28, marginTop: 24 }}>
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
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10, alignItems: 'center' }}>
              {COLORS.map(c => (
                <button
                  key={c} type="button"
                  onClick={() => set('accent_color', c)}
                  title={c}
                  style={{
                    width: 32, height: 32, borderRadius: 8, background: c, border: 'none', cursor: 'pointer',
                    outline: form.accent_color.toLowerCase() === c.toLowerCase() ? '3px solid #fff' : 'none',
                    outlineOffset: 2,
                  }}
                />
              ))}
              {/* Custom color — opens the native picker for any color */}
              <label title="Pick any color" style={{ position: 'relative', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'conic-gradient(from 90deg, #f43f5e, #eab308, #4ade80, #14b8a6, #8b7bf0, #a855f7, #f43f5e)', border: '1px solid #262631' }}>
                <span style={{ position: 'absolute', inset: 0, borderRadius: 8, boxShadow: 'inset 0 0 0 3px #141419' }} />
                <span style={{ position: 'relative', fontSize: 15, fontWeight: 800, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.5)' }}>+</span>
                <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(form.accent_color) ? form.accent_color : '#8b7bf0'}
                  onChange={e => set('accent_color', e.target.value)}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 38, height: 38, borderRadius: 8, background: form.accent_color, border: '1px solid #262631', flexShrink: 0 }} />
              <input style={{ ...S.input, fontFamily: 'monospace', width: 140 }} value={form.accent_color}
                onChange={e => set('accent_color', e.target.value)} placeholder="#8b7bf0" />
            </div>
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
            <label style={S.label}>System Prompt <span style={{ color: '#8B8B99', fontWeight: 400 }}>(optional)</span></label>
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
              style={{ background: '#8b7bf0', color: '#fff', fontWeight: 700, fontSize: 14, padding: '12px 28px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Creating…' : 'Create Chatbot →'}
            </button>
            <Link href="/dashboard/bots" style={{ display: 'flex', alignItems: 'center', color: '#8B8B99', fontSize: 14, textDecoration: 'none' }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
