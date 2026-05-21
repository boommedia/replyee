'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    router.push('/dashboard')
  }

  const S = {
    page:  { minHeight: '100vh', background: '#07080f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' },
    card:  { width: '100%', maxWidth: 420, background: '#0d1018', border: '1px solid #1a2035', borderRadius: 16, padding: '40px 36px' },
    label: { fontSize: 13, fontWeight: 600 as const, color: '#cbd5e1', display: 'block' as const, marginBottom: 6 },
    input: { width: '100%', background: '#07080f', border: '1px solid #1a2035', borderRadius: 8, padding: '11px 14px', fontSize: 14, color: '#e2e8f0', outline: 'none', boxSizing: 'border-box' as const },
    btn:   { width: '100%', background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: 14, padding: '12px', borderRadius: 8, border: 'none', cursor: 'pointer', marginTop: 8 },
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, background: '#6366f1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={16} color="#fff" />
            </div>
            <span style={{ fontWeight: 900, fontSize: 18, color: '#fff', letterSpacing: '-0.5px' }}>Replyee</span>
          </Link>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#e2e8f0', letterSpacing: '-0.5px', marginBottom: 6 }}>
          Set new password
        </h1>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28 }}>Choose a strong password for your account.</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>New password</label>
            <input
              style={S.input}
              type="password"
              required
              autoFocus
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min 8 characters"
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={S.label}>Confirm password</label>
            <input
              style={S.input}
              type="password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat password"
            />
          </div>
          {error && <div style={{ fontSize: 13, color: '#f87171', marginBottom: 12 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}
