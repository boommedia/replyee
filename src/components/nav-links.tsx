'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Bot, MessageCircle, BarChart3, Settings, Users } from 'lucide-react'

const NAV = [
  { href: '/dashboard',               icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/bots',          icon: Bot,             label: 'My Chatbots' },
  { href: '/dashboard/conversations', icon: MessageCircle,   label: 'Conversations' },
  { href: '/dashboard/analytics',     icon: BarChart3,       label: 'Analytics' },
  { href: '/dashboard/settings',      icon: Settings,        label: 'Settings' },
]

export function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {NAV.map(({ href, icon: Icon, label }) => {
        const active = isActive(href)
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8,
              fontSize: 13, fontWeight: 500,
              color: active ? '#6366f1' : '#94a3b8',
              background: active ? 'rgba(99,102,241,0.1)' : 'transparent',
              textDecoration: 'none', transition: 'all 0.15s',
            }}
          >
            <Icon size={16} />
            {label}
          </Link>
        )
      })}
      {isAdmin && (
        <Link
          href="/admin"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 8,
            fontSize: 13, fontWeight: 500,
            color: pathname.startsWith('/admin') ? '#f97316' : '#f97316',
            background: pathname.startsWith('/admin') ? 'rgba(249,115,22,0.1)' : 'transparent',
            textDecoration: 'none', marginTop: 8,
          }}
        >
          <Users size={16} />
          Admin Panel
        </Link>
      )}
    </nav>
  )
}
