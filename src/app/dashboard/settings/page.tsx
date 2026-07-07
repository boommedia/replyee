'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, CreditCard, AlertTriangle, Copy, Check, Link, ChevronDown } from 'lucide-react'

const UPGRADE_PLANS = [
  { id: 'starter', label: 'Starter', price: '$25/mo', bots: 1, convos: 500 },
  { id: 'growth',  label: 'Growth',  price: '$49/mo', bots: 5, convos: 3000 },
  { id: 'agency',  label: 'Agency',  price: '$99/mo', bots: 999, convos: -1 },
]

export default function SettingsPage() {
  const [profile, setProfile]     = useState({ full_name: '', email: '', plan: 'starter' })
  const [userId, setUserId]       = useState('')
  const [copiedId, setCopiedId]   = useState(false)
  const [password, setPassword]   = useState('')
  const [saving, setSaving]       = useState(false)
  const [msg, setMsg]             = useState('')
  const [pwMsg, setPwMsg]         = useState('')
  const [pwSaving, setPwSaving]   = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [botCount, setBotCount]   = useState(0)
  const [convoCount, setConvoCount] = useState(0)
  const [botLimit, setBotLimit]   = useState(1)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [billingMsg, setBillingMsg] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
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

  function copyUserId() {
    navigator.clipboard.writeText(userId)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

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

  async function openPortal() {
    setPortalLoading(true)
    setBillingMsg('')
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const data = await res.json()
    setPortalLoading(false)
    if (data.url) { window.location.href = data.url }
    else { setBillingMsg(data.error ?? 'Could not open billing portal') }
  }

  async function startCheckout(plan: string) {
    setUpgrading(plan)
    setBillingMsg('')
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const data = await res.json()
    setUpgrading(null)
    if (data.url) { window.location.href = data.url }
    else { setBillingMsg(data.error ?? 'Could not start checkout') }
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
    card:   { background: '#141419', border: '1px solid #262631', borderRadius: 14, padding: 24 },
    label:  { fontSize: 13, fontWeight: 600 as const, color: '#cbd5e1', display: 'block' as const, marginBottom: 6 },
    input:  { width: '100%', background: '#0B0B0F', border: '1px solid #262631', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#ECECF1', outline: 'none' },
    group:  { marginBottom: 20 },
    btn:    { background: '#8b7bf0', color: '#fff', fontWeight: 700, fontSize: 13, padding: '10px 22px', borderRadius: 8, border: 'none', cursor: 'pointer' },
    track:  { height: 5, background: '#262631', borderRadius: 99, overflow: 'hidden', marginTop: 6 },
    fill:   (pct: number) => ({ width: `${pct}%`, height: '100%', background: '#8b7bf0', borderRadius: 99 }),
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-1px', color: '#ECECF1' }}>Account Settings</h1>
        <p style={{ fontSize: 14, color: '#8B8B99', marginTop: 4 }}>Manage your profile and billing.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Profile */}
          <div style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <User size={16} style={{ color: '#8b7bf0' }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: '#ECECF1' }}>Profile</span>
            </div>
            <form onSubmit={saveProfile}>
              <div style={S.group}>
                <label style={S.label}>Full Name</label>
                <input style={S.input} value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} />
              </div>
              <div style={S.group}>
                <label style={S.label}>Email</label>
                <input style={{ ...S.input, color: '#8B8B99' }} value={profile.email} readOnly />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button type="submit" disabled={saving} style={{ ...S.btn, opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                {msg && <span style={{ fontSize: 13, color: msg === 'Saved!' ? '#4ade80' : '#f87171' }}>{msg}</span>}
              </div>
            </form>
          </div>

          {/* BOO Integration — User ID */}
          <div style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Link size={16} style={{ color: '#8b7bf0' }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: '#ECECF1' }}>Boom Online Ordering</span>
            </div>
            <p style={{ fontSize: 13, color: '#8B8B99', marginBottom: 14, lineHeight: 1.6 }}>
              To connect Replyee to your BOO restaurant portal, copy your Replyee User ID and paste it into the BOO portal under Connected Apps → Replyee.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <code style={{ flex: 1, background: '#0B0B0F', border: '1px solid #262631', borderRadius: 7, padding: '9px 12px', fontSize: 12, color: '#94a3b8', wordBreak: 'break-all' }}>
                {userId || '…'}
              </code>
              <button onClick={copyUserId} style={{ ...S.btn, padding: '9px 14px', flexShrink: 0 }}>
                {copiedId ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
              </button>
            </div>
          </div>

          {/* Password */}
          <div style={S.card}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#ECECF1', marginBottom: 16 }}>Change Password</div>
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
              <span style={{ fontSize: 15, fontWeight: 700, color: '#ECECF1' }}>Danger Zone</span>
            </div>
            <p style={{ fontSize: 13, color: '#8B8B99', marginBottom: 16 }}>Permanently delete your account and all chatbots.</p>
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
                <button onClick={() => setDeleteConfirm(false)} style={{ background: 'transparent', color: '#8B8B99', fontSize: 13, padding: '6px 12px', border: '1px solid #262631', borderRadius: 7, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Billing */}
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <CreditCard size={16} style={{ color: '#8b7bf0' }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#ECECF1' }}>Billing</span>
          </div>

          <div style={{ background: 'rgba(139,123,240,.08)', border: '1px solid rgba(139,123,240,.2)', borderRadius: 10, padding: '16px 18px', marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: '#8B8B99', marginBottom: 4 }}>Current Plan</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#8b7bf0', textTransform: 'capitalize' }}>{profile.plan}</div>
            <div style={{ fontSize: 13, color: '#8B8B99', marginTop: 4 }}>
              {profile.plan === 'starter' ? '$25/month' : profile.plan === 'growth' ? '$49/month' : profile.plan === 'agency' ? '$99/month' : '14-day free trial'}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#8B8B99' }}>
              <span>Conversations</span>
              <span style={{ color: '#ECECF1' }}>
                {convoCount.toLocaleString()} / {limits.convos ? limits.convos.toLocaleString() : '∞'}
              </span>
            </div>
            {limits.convos && <div style={S.track}><div style={S.fill(convoPct)} /></div>}
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#8B8B99' }}>
              <span>Chatbots</span>
              <span style={{ color: '#ECECF1' }}>{botCount} / {limits.bots < 999 ? limits.bots : '∞'}</span>
            </div>
            {limits.bots < 999 && <div style={S.track}><div style={S.fill(botPct)} /></div>}
          </div>

          {billingMsg && (
            <div style={{ background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.25)', borderRadius: 8, padding: '9px 13px', fontSize: 13, color: '#f87171', marginBottom: 14 }}>
              {billingMsg}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={openPortal} disabled={portalLoading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#8b7bf0', color: '#fff', fontWeight: 700, fontSize: 13, padding: '11px', borderRadius: 8, border: 'none', cursor: portalLoading ? 'not-allowed' : 'pointer', opacity: portalLoading ? 0.7 : 1 }}>
              {portalLoading ? 'Loading…' : 'Manage Billing / Cancel'}
            </button>
            <button onClick={() => setShowUpgrade(v => !v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'transparent', color: '#8b7bf0', fontWeight: 600, fontSize: 13, padding: '11px', borderRadius: 8, border: '1px solid rgba(139,123,240,.3)', cursor: 'pointer' }}>
              Upgrade Plan <ChevronDown size={14} style={{ transform: showUpgrade ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
            </button>
          </div>

          {showUpgrade && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {UPGRADE_PLANS.map(p => (
                <div key={p.id} style={{ background: '#0B0B0F', border: `1px solid ${p.id === profile.plan ? 'rgba(139,123,240,.5)' : '#262631'}`, borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#ECECF1', marginBottom: 2 }}>{p.label} — {p.price}</div>
                    <div style={{ fontSize: 12, color: '#8B8B99' }}>
                      {p.bots < 999 ? p.bots : '∞'} bot{p.bots !== 1 ? 's' : ''} · {p.convos > 0 ? p.convos.toLocaleString() : '∞'} convos/mo
                    </div>
                  </div>
                  {p.id === profile.plan ? (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#8b7bf0', background: 'rgba(139,123,240,.1)', padding: '4px 10px', borderRadius: 20 }}>Current</span>
                  ) : (
                    <button onClick={() => startCheckout(p.id)} disabled={upgrading === p.id} style={{ background: '#8b7bf0', color: '#fff', fontWeight: 700, fontSize: 12, padding: '7px 16px', borderRadius: 7, border: 'none', cursor: upgrading === p.id ? 'not-allowed' : 'pointer', opacity: upgrading === p.id ? 0.7 : 1 }}>
                      {upgrading === p.id ? '…' : 'Select'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
