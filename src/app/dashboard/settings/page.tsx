'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, CreditCard, AlertTriangle } from 'lucide-react'

export default function SettingsPage() {
  const [profile, setProfile]     = useState({ full_name: '', email: '', plan: 'starter' })
  const [password, setPassword]   = useState('')
  const [saving, setSaving]       = useState(false)
  const [msg, setMsg]             = useState('')
  const [pwMsg, setPwMsg]         = useState('')
  const [pwSaving, setPwSaving]   = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [botCount, setBotCount]   = useState(0)
  const [convoCount, setConvoCount] = useState(0)
  const [botLimit, setBotLimit]   = useState(1)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from('replyee_profiles').select('full_name, plan, bot_limit').eq('id', user.id).single()
      if (p) {
        setProfile({ full_name: p.full_name ?? '', email: user.email ?? '', plan: p.plan })
        setBotLimit(p.bot_limit ?? 1)
      }
      const { data: bots } = await supabase.from('replyee_chatbots').select('conversation_count').eq('user_id', user.id)
      setBotCount(bots?.length ?? 0)
      setConvoCount(bots?.reduce((s, b) => s + (b.conversation_count ?? 0), 0) ?? 0)
    }
    load()
  }, [])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('replyee_profiles').update({ full_name: profile.full_name }).eq('id', user.id)
    setSaving(false)
    setMsg(error ? error.message : 'Saved!')
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setPwMsg('Password must be at least 8 characters'); return }
    setPwSaving(true)
    setPwMsg('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setPwSaving(false)
    setPassword('')
    setPwMsg(error ? error.message : 'Password updated!')
  }

  async function deleteAccount() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const PLAN_LIMITS: Record<string, { convos: number | null; bots: number }> = {
    starter: { convos: 500, bots: 1 },
    growth:  { convos: 3000, bots: 5 },
    agency:  { convos: null, bots: 999 },
  }
  const limits = PLAN_LIMITS[profile.plan] ?? PLAN_LIMITS.starter
  const convoPct = limits.convos ? Math.min(Math.round((convoCount / limits.convos) * 100), 100) : 0
  const botPct   = limits.bots < 999 ? Math.min(Math.round((botCount / limits.bots) * 100), 100) : 0

  const S = {
    card:   { background: '#0d1018', border: '1px solid #1a2035', borderRadius: 14, padding: 24 },
    label:  { fontSize: 13, fontWeight: 600 as const, color: '#cbd5e1', display: 'block' as const, marginBottom: 6 },
    input:  { width: '100%', background: '#07080f', border: '1px solid #1a2035', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#e2e8f0', outline: 'none' },
    group:  { marginBottom: 20 },
    btn:    { background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: 13, padding: '10px 22px', borderRadius: 8, border: 'none', cursor: 'pointer' },
    track:  { height: 5, background: '#1a2035', borderRadius: 99, overflow: 'hidden', marginTop: 6 },
    fill:   (pct: number) => ({ width: `${pct}%`, height: '100%', background: '#6366f1', borderRadius: 99 }),
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-1px', color: '#e2e8f0' }}>Account Settings</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Manage your profile and billing.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Profile */}
          <div style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <User size={16} style={{ color: '#6366f1' }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>Profile</span>
            </div>
            <form onSubmit={saveProfile}>
              <div style={S.group}>
                <label style={S.label}>Full Name</label>
                <input style={S.input} value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} />
              </div>
              <div style={S.group}>
                <label style={S.label}>Email</label>
                <input style={{ ...S.input, color: '#64748b' }} value={profile.email} readOnly />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button type="submit" disabled={saving} style={{ ...S.btn, opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                {msg && <span style={{ fontSize: 13, color: msg === 'Saved!' ? '#4ade80' : '#f87171' }}>{msg}</span>}
              </div>
            </form>
          </div>

          {/* Password */}
          <div style={S.card}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 16 }}>Change Password</div>
            <form onSubmit={changePassword}>
              <div style={S.group}>
                <label style={S.label}>New Password</label>
                <input style={S.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" minLength={8} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button type="submit" disabled={pwSaving} style={{ ...S.btn, opacity: pwSaving ? 0.7 : 1 }}>
                  {pwSaving ? 'Updating…' : 'Update Password'}
                </button>
                {pwMsg && <span style={{ fontSize: 13, color: pwMsg === 'Password updated!' ? '#4ade80' : '#f87171' }}>{pwMsg}</span>}
              </div>
            </form>
          </div>

          {/* Danger zone */}
          <div style={{ ...S.card, borderColor: 'rgba(239,68,68,.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <AlertTriangle size={16} style={{ color: '#ef4444' }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>Danger Zone</span>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Permanently delete your account and all chatbots.</p>
            {!deleteConfirm ? (
              <button onClick={() => setDeleteConfirm(true)} style={{ background: 'rgba(239,68,68,.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,.3)', fontSize: 13, fontWeight: 700, padding: '8px 18px', borderRadius: 8, cursor: 'pointer' }}>
                Delete Account
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#f87171' }}>This cannot be undone.</span>
                <button onClick={deleteAccount} style={{ background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 700, padding: '6px 16px', borderRadius: 7, border: 'none', cursor: 'pointer' }}>
                  Yes, delete
                </button>
                <button onClick={() => setDeleteConfirm(false)} style={{ background: 'transparent', color: '#64748b', fontSize: 13, padding: '6px 12px', border: '1px solid #1a2035', borderRadius: 7, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Billing */}
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <CreditCard size={16} style={{ color: '#6366f1' }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>Billing</span>
          </div>

          <div style={{ background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.2)', borderRadius: 10, padding: '16px 18px', marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Current Plan</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#6366f1', textTransform: 'capitalize' }}>{profile.plan}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
              {profile.plan === 'starter' ? '$25/month' : profile.plan === 'growth' ? '$49/month' : profile.plan === 'agency' ? '$99/month' : 'Free trial'}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
              <span>Conversations</span>
              <span style={{ color: '#e2e8f0' }}>
                {convoCount.toLocaleString()} / {limits.convos ? limits.convos.toLocaleString() : '∞'}
              </span>
            </div>
            {limits.convos && <div style={S.track}><div style={S.fill(convoPct)} /></div>}
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
              <span>Chatbots</span>
              <span style={{ color: '#e2e8f0' }}>{botCount} / {limits.bots < 999 ? limits.bots : '∞'}</span>
            </div>
            {limits.bots < 999 && <div style={S.track}><div style={S.fill(botPct)} /></div>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a href="https://billing.stripe.com/p/login" target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: 13, padding: '11px', borderRadius: 8, textDecoration: 'none' }}>
              Manage Billing / Cancel
            </a>
            <a href="/#pricing" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: '#6366f1', fontWeight: 600, fontSize: 13, padding: '11px', borderRadius: 8, border: '1px solid rgba(99,102,241,.3)', textDecoration: 'none' }}>
              Upgrade Plan
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
