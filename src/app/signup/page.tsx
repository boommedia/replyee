'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MessageSquare, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const PRIMARY = '#6366f1'
const BG      = '#07080f'
const BG2     = '#0d1018'
const BORDER  = '#1a2035'
const BODY    = '#64748b'

const PERKS = ['14-day free trial', 'No credit card required', 'First bot live in 60 seconds']

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <main style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, background: PRIMARY, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={18} color="#fff" />
            </div>
            <span style={{ fontWeight: 900, fontSize: 20, color: '#fff', letterSpacing: '-0.5px' }}>Replyee</span>
          </Link>
        </div>

        {/* Perks */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
          {PERKS.map(p => (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: BODY }}>
              <Check size={12} style={{ color: '#4ade80' }} /> {p}
            </div>
          ))}
        </div>

        <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.5px' }}>Create your account</h1>
          <p style={{ color: BODY, fontSize: 14, marginBottom: 28 }}>Start your 14-day free trial — no card needed.</p>

          {error && (
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" required className="input" />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="input" />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" minLength={8} required className="input" />
            </div>
            <button type="submit" disabled={loading} style={{ background: PRIMARY, color: '#fff', fontWeight: 700, fontSize: 14, padding: '12px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4 }}>
              {loading ? 'Creating account…' : 'Create Free Account →'}
            </button>
          </form>

          <p style={{ fontSize: 12, color: BODY, marginTop: 20, lineHeight: 1.6 }}>
            By signing up you agree to our{' '}
            <Link href="/terms" style={{ color: PRIMARY, textDecoration: 'none' }}>Terms</Link> and{' '}
            <Link href="/privacy" style={{ color: PRIMARY, textDecoration: 'none' }}>Privacy Policy</Link>.
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: BODY, marginTop: 20 }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: PRIMARY, textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </main>
  )
}
