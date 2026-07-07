import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare, LogOut } from 'lucide-react'
import { AdminNavLinks } from '@/components/admin-nav-links'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'eric@boommedia.us') {
    redirect('/dashboard')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0B0B0F' }}>
      <aside style={{ width: 240, borderRight: '1px solid #262631', background: '#141419', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, bottom: 0, left: 0 }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #262631' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 30, height: 30, background: '#8b7bf0', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={15} color="#fff" />
            </div>
            <span style={{ fontWeight: 900, fontSize: 16, color: '#fff', letterSpacing: '-0.5px' }}>Replyee</span>
          </Link>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(249,115,22,.12)', border: '1px solid rgba(249,115,22,.25)', borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 800, color: '#f97316', letterSpacing: '.06em', marginTop: 8 }}>
            BOOM MEDIA ADMIN
          </div>
        </div>

        <AdminNavLinks />

        <div style={{ padding: '16px 20px', borderTop: '1px solid #262631' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#ECECF1', marginBottom: 2 }}>Eric Duffy</div>
          <div style={{ fontSize: 11, color: '#f97316', fontWeight: 700, marginBottom: 12 }}>Super Admin</div>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8B8B99', textDecoration: 'none', marginBottom: 8 }}>
            ← Back to Dashboard
          </Link>
          <form action="/auth/signout" method="post">
            <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#8B8B99', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
              <LogOut size={14} /> Sign Out
            </button>
          </form>
        </div>
      </aside>

      <main style={{ marginLeft: 240, flex: 1, padding: '32px 40px', maxWidth: 'calc(100vw - 240px)' }}>
        {children}
      </main>
    </div>
  )
}
