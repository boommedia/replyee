'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import { MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const PRIMARY = '#8b7bf0'
const BG      = '#0B0B0F'
const BG2     = '#141419'
const BORDER  = '#262631'
const BODY    = '#8B8B99'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <main style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none' }}><Logo /></Link>
        </div>

        <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.5px' }}>Welcome back</h1>
          <p style={{ color: BODY, fontSize: 14, marginBottom: 28 }}>Sign in to your Replyee dashboard</p>

          {error && (
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="input"
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1' }}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: 12, color: PRIMARY, textDecoration: 'none' }}>Forgot password?</Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="input"
              />
            </div>
            <button type="submit" disabled={loading} style={{ background: PRIMARY, color: '#fff', fontWeight: 700, fontSize: 14, padding: '12px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4 }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: BODY, marginTop: 20 }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: PRIMARY, textDecoration: 'none', fontWeight: 600 }}>Start free trial</Link>
        </p>
      </div>
    </main>
  )
}
