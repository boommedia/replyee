'use client'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { LayoutDashboard, Users, Bot, DollarSign, BarChart3, Bell } from 'lucide-react'

const NAV = [
  { href: '/admin',              query: null,       icon: LayoutDashboard, label: 'Overview' },
  { href: '/admin',              query: 'users',    icon: Users,           label: 'All Users' },
  { href: '/admin',              query: 'bots',     icon: Bot,             label: 'All Chatbots' },
  { href: '/admin',              query: 'revenue',  icon: DollarSign,      label: 'Revenue' },
  { href: '/admin',              query: 'usage',    icon: BarChart3,       label: 'API Usage' },
  { href: '/admin',              query: 'alerts',   icon: Bell,            label: 'Alerts' },
]

export function AdminNavLinks() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const section = searchParams.get('section')

  function isActive(query: string | null) {
    if (pathname !== '/admin') return false
    if (query === null) return !section
    return section === query
  }

  return (
    <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {NAV.map(({ href, query, icon: Icon, label }) => {
        const active = isActive(query)
        const fullHref = query ? `${href}?section=${query}` : href
        return (
          <Link
            key={label}
            href={fullHref}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8,
              fontSize: 13, fontWeight: 500,
              color: active ? '#f97316' : '#94a3b8',
              background: active ? 'rgba(249,115,22,0.1)' : 'transparent',
              textDecoration: 'none',
            }}
          >
            <Icon size={16} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
