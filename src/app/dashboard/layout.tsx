import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Logo from '@/components/Logo'
import { MessageSquare, LogOut } from 'lucide-react'
import { NavLinks } from '@/components/nav-links'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('replyee_profiles')
    .select('full_name, plan')
    .eq('id', user.id)
    .single()

  const isAdmin = user.email === 'eric@boommedia.us'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0B0B0F' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, borderRight: '1px solid #262631', background: '#141419', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, bottom: 0, left: 0 }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #262631' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Logo />
          </Link>
        </div>

        <NavLinks isAdmin={isAdmin} />

        {/* User + sign out */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #262631' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#ECECF1', marginBottom: 2 }}>
            {profile?.full_name ?? user.email}
          </div>
          <div style={{ fontSize: 11, color: '#8B8B99', marginBottom: 12, textTransform: 'capitalize' }}>
            {profile?.plan ?? 'Starter'} Plan
          </div>
          <form action="/auth/signout" method="post">
            <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#8B8B99', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
              <LogOut size={14} /> Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: 240, flex: 1, padding: '32px 40px', maxWidth: 'calc(100vw - 240px)' }}>
        {children}
      </main>
    </div>
  )
}
