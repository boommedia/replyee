'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { MessageSquare } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSent(true)
  }

  const S = {
    page:  { minHeight: '100vh', background: '#0B0B0F', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' },
    card:  { width: '100%', maxWidth: 420, background: '#141419', border: '1px solid #262631', borderRadius: 16, padding: '40px 36px' },
    label: { fontSize: 13, fontWeight: 600 as const, color: '#cbd5e1', display: 'block' as const, marginBottom: 6 },
    input: { width: '100%', background: '#0B0B0F', border: '1px solid #262631', borderRadius: 8, padding: '11px 14px', fontSize: 14, color: '#ECECF1', outline: 'none', boxSizing: 'border-box' as const },
    btn:   { width: '100%', background: '#8b7bf0', color: '#fff', fontWeight: 700, fontSize: 14, padding: '12px', borderRadius: 8, border: 'none', cursor: 'pointer', marginTop: 8 },
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, background: '#8b7bf0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={16} color="#fff" />
            </div>
            <span style={{ fontWeight: 900, fontSize: 18, color: '#fff', letterSpacing: '-0.5px' }}>Replyee</span>
          </Link>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📧</div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#ECECF1', marginBottom: 10 }}>Check your inbox</h1>
            <p style={{ fontSize: 14, color: '#8B8B99', marginBottom: 24 }}>
              We sent a password reset link to <strong style={{ color: '#ECECF1' }}>{email}</strong>
            </p>
            <Link href="/login" style={{ fontSize: 13, color: '#8b7bf0' }}>← Back to login</Link>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#ECECF1', letterSpacing: '-0.5px', marginBottom: 6 }}>
              Forgot password?
            </h1>
            <p style={{ fontSize: 14, color: '#8B8B99', marginBottom: 28 }}>
              Enter your email and we&apos;ll send a reset link.
            </p>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={S.label}>Email address</label>
                <input
                  style={S.input}
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              {error && <div style={{ fontSize: 13, color: '#f87171', marginBottom: 12 }}>{error}</div>}
              <button type="submit" disabled={loading} style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#8B8B99' }}>
              Remember it? <Link href="/login" style={{ color: '#8b7bf0', textDecoration: 'none' }}>Back to login</Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
