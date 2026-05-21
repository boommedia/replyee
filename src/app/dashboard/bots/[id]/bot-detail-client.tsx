'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Bot, Globe, FileText, Check, Copy, Upload, Plus, Trash2, ExternalLink } from 'lucide-react'

interface KnowledgeSource { name: string; type: string; count: number; createdAt: string }
interface Lead { id: string; visitor_email: string; question: string | null; created_at: string }
interface Chatbot {
  id: string; name: string; website_url: string | null; accent_color: string
  system_prompt: string | null; greeting_message: string; fallback_message: string
  chunk_count: number; conversation_count: number; lead_count: number; is_active: boolean
}

const TABS = [
  { id: 'kb',       label: 'Knowledge Base' },
  { id: 'embed',    label: 'Embed Code' },
  { id: 'settings', label: 'Settings' },
  { id: 'leads',    label: '' }, // label set dynamically
]

const S = {
  card: { background: '#0d1018', border: '1px solid #1a2035', borderRadius: 14, padding: 24 },
  label: { fontSize: 13, fontWeight: 600 as const, color: '#cbd5e1', display: 'block' as const, marginBottom: 6 },
  input: { width: '100%', background: '#07080f', border: '1px solid #1a2035', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#e2e8f0', outline: 'none' },
  group: { marginBottom: 20 },
  hint: { fontSize: 12, color: '#64748b', marginTop: 5 },
  btn: { background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: 13, padding: '9px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 },
  btnGhost: { background: 'rgba(99,102,241,0.12)', color: '#6366f1', fontWeight: 700, fontSize: 13, padding: '9px 18px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 },
}

export function BotDetailClient({ bot, knowledgeSources, leads, activeTab }: {
  bot: Chatbot
  knowledgeSources: KnowledgeSource[]
  leads: Lead[]
  activeTab: string
}) {
  const router = useRouter()
  const [tab, setTab] = useState(activeTab)
  const [copied, setCopied] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [urlLoading, setUrlLoading] = useState(false)
  const [urlError, setUrlError] = useState('')
  const [fileLoading, setFileLoading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const [settings, setSettings] = useState({
    name: bot.name, website_url: bot.website_url ?? '',
    greeting_message: bot.greeting_message, fallback_message: bot.fallback_message,
    system_prompt: bot.system_prompt ?? '', accent_color: bot.accent_color,
  })
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsMsg, setSettingsMsg] = useState('')
  const [, startTransition] = useTransition()

  const embedCode = `<script src="${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://replyee.online'}/widget.js" data-bot-id="${bot.id}" async></script>`

  function switchTab(t: string) {
    setTab(t)
    startTransition(() => router.push(`/dashboard/bots/${bot.id}?tab=${t}`, { scroll: false } as Parameters<typeof router.push>[1] & { scroll: boolean }))
  }

  function copyEmbed() {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function ingestUrl() {
    if (!urlInput.trim()) return
    setUrlLoading(true)
    setUrlError('')
    try {
      const res = await fetch('/api/ingest/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId: bot.id, url: urlInput }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Failed') }
      setUrlInput('')
      setUploadMsg('URL ingested successfully!')
      router.refresh()
    } catch (e: unknown) {
      setUrlError(e instanceof Error ? e.message : 'Failed to ingest URL')
    } finally {
      setUrlLoading(false)
    }
  }

  async function ingestFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileLoading(true)
    setUploadMsg('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('botId', bot.id)
      const res = await fetch('/api/ingest/file', { method: 'POST', body: fd })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Failed') }
      setUploadMsg('File ingested successfully!')
      router.refresh()
    } catch (e: unknown) {
      setUploadMsg(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setFileLoading(false)
      e.target.value = ''
    }
  }

  async function deleteSource(sourceName: string) {
    const supabase = createClient()
    await supabase.from('knowledge_chunks').delete().eq('chatbot_id', bot.id).eq('source_name', sourceName)
    router.refresh()
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSettingsSaving(true)
    setSettingsMsg('')
    const supabase = createClient()
    const { error } = await supabase.from('chatbots').update(settings).eq('id', bot.id)
    setSettingsSaving(false)
    setSettingsMsg(error ? error.message : 'Saved!')
    if (!error) router.refresh()
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, background: bot.accent_color, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bot size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', color: '#e2e8f0', marginBottom: 2 }}>{bot.name}</h1>
            <p style={{ fontSize: 13, color: '#64748b' }}>
              {bot.website_url ?? 'No website'} &nbsp;·&nbsp; {bot.conversation_count} conversations &nbsp;·&nbsp; {bot.lead_count} leads
            </p>
          </div>
        </div>
        <a href={`${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://replyee.online'}/preview/${bot.id}`} target="_blank" rel="noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,.12)', color: '#6366f1', border: '1px solid rgba(99,102,241,.3)', fontWeight: 600, fontSize: 13, padding: '9px 16px', borderRadius: 8, textDecoration: 'none' }}>
          <ExternalLink size={13} /> Preview Widget
        </a>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: '#0d1018', border: '1px solid #1a2035', padding: 4, borderRadius: 10, width: 'fit-content', marginBottom: 28 }}>
        {[
          { id: 'kb', label: 'Knowledge Base' },
          { id: 'embed', label: 'Embed Code' },
          { id: 'settings', label: 'Settings' },
          { id: 'leads', label: `Leads (${bot.lead_count})` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => switchTab(t.id)}
            style={{
              padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: tab === t.id ? '#6366f1' : 'transparent',
              color: tab === t.id ? '#fff' : '#64748b',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Knowledge Base ── */}
      {tab === 'kb' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>Knowledge Sources</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{bot.chunk_count} chunks indexed</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {/* URL input */}
              <input
                value={urlInput} onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && ingestUrl()}
                placeholder="https://your-site.com/faq"
                style={{ ...S.input, width: 260, padding: '8px 12px', fontSize: 13 }}
              />
              <button onClick={ingestUrl} disabled={urlLoading} style={S.btnGhost}>
                <Globe size={13} /> {urlLoading ? 'Scraping…' : 'Add URL'}
              </button>
              <label style={{ ...S.btn, cursor: 'pointer' }}>
                <Upload size={13} /> {fileLoading ? 'Uploading…' : 'Upload PDF'}
                <input type="file" accept=".pdf,.txt" onChange={ingestFile} style={{ display: 'none' }} disabled={fileLoading} />
              </label>
            </div>
          </div>

          {(urlError || uploadMsg) && (
            <div style={{ background: urlError ? 'rgba(248,113,113,.1)' : 'rgba(74,222,128,.1)', border: `1px solid ${urlError ? 'rgba(248,113,113,.3)' : 'rgba(74,222,128,.3)'}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: urlError ? '#f87171' : '#4ade80', marginBottom: 16 }}>
              {urlError || uploadMsg}
            </div>
          )}

          {knowledgeSources.length === 0 ? (
            <div style={{ border: '2px dashed #1a2035', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
              <FileText size={36} style={{ color: '#64748b', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ color: '#64748b', fontSize: 14, marginBottom: 8 }}>No knowledge sources yet.</p>
              <p style={{ color: '#64748b', fontSize: 13 }}>Upload a PDF or add a URL to train your bot.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {knowledgeSources.map(s => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#0d1018', border: '1px solid #1a2035', borderRadius: 10 }}>
                  <div style={{ width: 36, height: 36, background: 'rgba(34,211,238,.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {s.type === 'url' ? <Globe size={16} color="#22d3ee" /> : <FileText size={16} color="#22d3ee" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{s.count} chunks · {new Date(s.createdAt).toLocaleDateString()}</div>
                  </div>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 700, background: 'rgba(74,222,128,.1)', color: '#4ade80' }}>✓ Indexed</span>
                  <button onClick={() => deleteSource(s.name)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: 4 }} title="Remove source">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Embed Code ── */}
      {tab === 'embed' && (
        <div style={{ maxWidth: 680 }}>
          <div style={S.card}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>Your Embed Code</div>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>
              Copy this script tag and paste it before the <code style={{ color: '#22d3ee', background: '#0a0c14', padding: '1px 5px', borderRadius: 4 }}>&lt;/body&gt;</code> tag on your website.
            </p>
            <div style={{ background: '#0a0c14', border: '1px solid #1a2035', borderRadius: 10, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
              <code style={{ fontSize: 12, color: '#94a3b8', wordBreak: 'break-all', flex: 1 }}>{embedCode}</code>
              <button onClick={copyEmbed} style={{ ...S.btn, whiteSpace: 'nowrap', flexShrink: 0 }}>
                {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
              </button>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 10 }}>Works on:</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['WordPress', 'Webflow', 'Shopify', 'Squarespace', 'Wix', 'Any HTML site'].map(p => (
                  <span key={p} style={{ fontSize: 12, padding: '4px 12px', background: '#07080f', border: '1px solid #1a2035', borderRadius: 6, color: '#64748b' }}>{p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Settings ── */}
      {tab === 'settings' && (
        <div style={{ maxWidth: 560 }}>
          <form onSubmit={saveSettings} style={S.card}>
            <div style={S.group}>
              <label style={S.label}>Bot Name</label>
              <input style={S.input} value={settings.name} onChange={e => setSettings(s => ({ ...s, name: e.target.value }))} required />
            </div>
            <div style={S.group}>
              <label style={S.label}>Website URL</label>
              <input style={S.input} value={settings.website_url} onChange={e => setSettings(s => ({ ...s, website_url: e.target.value }))} placeholder="https://yoursite.com" />
            </div>
            <div style={S.group}>
              <label style={S.label}>Greeting Message</label>
              <input style={S.input} value={settings.greeting_message} onChange={e => setSettings(s => ({ ...s, greeting_message: e.target.value }))} />
            </div>
            <div style={S.group}>
              <label style={S.label}>Fallback Message</label>
              <input style={S.input} value={settings.fallback_message} onChange={e => setSettings(s => ({ ...s, fallback_message: e.target.value }))} />
            </div>
            <div style={S.group}>
              <label style={S.label}>Accent Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input style={{ ...S.input, flex: 1 }} value={settings.accent_color} onChange={e => setSettings(s => ({ ...s, accent_color: e.target.value }))} />
                <div style={{ width: 36, height: 36, borderRadius: 8, background: settings.accent_color, flexShrink: 0 }} />
              </div>
            </div>
            <div style={S.group}>
              <label style={S.label}>System Prompt <span style={{ color: '#64748b', fontWeight: 400 }}>(optional)</span></label>
              <textarea style={{ ...S.input, resize: 'vertical', minHeight: 100 }} value={settings.system_prompt} onChange={e => setSettings(s => ({ ...s, system_prompt: e.target.value }))} />
              <p style={S.hint}>Custom AI instructions. Leave blank for sensible defaults.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button type="submit" disabled={settingsSaving} style={{ ...S.btn, opacity: settingsSaving ? 0.7 : 1 }}>
                {settingsSaving ? 'Saving…' : 'Save Changes'}
              </button>
              {settingsMsg && (
                <span style={{ fontSize: 13, color: settingsMsg === 'Saved!' ? '#4ade80' : '#f87171' }}>{settingsMsg}</span>
              )}
            </div>
          </form>

          {/* Danger zone */}
          <div style={{ ...S.card, marginTop: 20, borderColor: 'rgba(239,68,68,.2)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>Danger Zone</div>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Permanently delete this chatbot and all its data.</p>
            <DeleteBotButton botId={bot.id} />
          </div>
        </div>
      )}

      {/* ── Leads ── */}
      {tab === 'leads' && (
        <div>
          {leads.length === 0 ? (
            <div style={{ background: '#0d1018', border: '1px solid #1a2035', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
              <p style={{ color: '#64748b', fontSize: 14 }}>No leads captured yet. When your bot can't answer a question, it'll capture the visitor's email here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {leads.map(l => (
                <div key={l.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, background: 'rgba(249,115,22,.06)', border: '1px solid rgba(249,115,22,.2)', borderRadius: 12, padding: 16 }}>
                  <div style={{ width: 8, height: 8, background: '#f97316', borderRadius: '50%', flexShrink: 0, marginTop: 4 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>
                      <a href={`mailto:${l.visitor_email}`} style={{ color: '#6366f1', textDecoration: 'none' }}>{l.visitor_email}</a>
                    </div>
                    {l.question && <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>"{l.question}"</div>}
                    <div style={{ fontSize: 11, color: '#64748b' }}>{new Date(l.created_at).toLocaleString()}</div>
                  </div>
                  <a href={`mailto:${l.visitor_email}`} style={{ fontSize: 12, padding: '6px 12px', background: '#6366f1', color: '#fff', borderRadius: 6, textDecoration: 'none', fontWeight: 600, flexShrink: 0 }}>
                    Reply
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DeleteBotButton({ botId }: { botId: string }) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function doDelete() {
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('chatbots').delete().eq('id', botId)
    router.push('/dashboard/bots')
  }

  if (confirm) {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#f87171' }}>Are you sure? This cannot be undone.</span>
        <button onClick={doDelete} disabled={deleting} style={{ background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 700, padding: '6px 16px', borderRadius: 7, border: 'none', cursor: 'pointer' }}>
          {deleting ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button onClick={() => setConfirm(false)} style={{ background: 'transparent', color: '#64748b', fontSize: 13, padding: '6px 12px', border: '1px solid #1a2035', borderRadius: 7, cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirm(true)} style={{ background: 'rgba(239,68,68,.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,.3)', fontSize: 13, fontWeight: 700, padding: '8px 18px', borderRadius: 8, cursor: 'pointer' }}>
      Delete Chatbot
    </button>
  )
}
