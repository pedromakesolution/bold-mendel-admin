'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  BarChart2,
  ClipboardList,
  LogOut,
  Shield,
  LifeBuoy,
  FileText,
  TrendingUp,
  Globe2,
  Brain,
  Share2,
  Mail,
} from 'lucide-react'
import { signOut } from '@/app/actions/auth'
import { useTicketCountStore } from '@/stores/ticketCountStore'
import { useEffect } from 'react'

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    shortLabel: 'Dashboard',
    icon: LayoutDashboard,
    group: 'main',
  },
  {
    href: '/users',
    label: 'Usuários',
    shortLabel: 'Usuários',
    icon: Users,
    group: 'main',
  },
  {
    href: '/finance',
    label: 'Financeiro',
    shortLabel: 'Finanças',
    icon: BarChart2,
    group: 'main',
  },
  {
    href: '/audit',
    label: 'Auditoria',
    shortLabel: 'Auditoria',
    icon: ClipboardList,
    group: 'main',
  },
  {
    href: '/support',
    label: 'Suporte',
    shortLabel: 'Suporte',
    icon: LifeBuoy,
    group: 'main',
  },
  {
    href: '/ai-analytics',
    label: 'IA Analytics',
    shortLabel: 'IA',
    icon: Brain,
    group: 'main',
  },
  {
    href: '/social-media',
    label: 'Social Media',
    shortLabel: 'Social',
    icon: Share2,
    group: 'content',
  },
  {
    href: '/site',
    label: 'Site (GSC)',
    shortLabel: 'Site',
    icon: Globe2,
    group: 'content',
  },
  {
    href: '/blog',
    label: 'Blog',
    shortLabel: 'Blog',
    icon: FileText,
    group: 'content',
  },
  {
    href: '/blog/seo',
    label: 'SEO Analytics',
    shortLabel: 'SEO',
    icon: TrendingUp,
    group: 'content',
  },
] as const

type NavItem = typeof NAV_ITEMS[number]

export default function AdminSidebar({
  adminName,
  adminEmail,
  initialOpenTicketCount = 0,
}: {
  adminName: string
  adminEmail: string
  initialOpenTicketCount?: number
}) {
  const pathname = usePathname()
  const { count, setCount } = useTicketCountStore()

  useEffect(() => {
    setCount(initialOpenTicketCount)
  }, [initialOpenTicketCount, setCount])

  const initials = adminName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  function isActive(href: string) {
    // Para /blog/seo, match exato para não colidir com /blog
    if (href === '/blog/seo') return pathname === href || pathname.startsWith(href + '/')
    if (href === '/blog') return pathname === href || (pathname.startsWith(href + '/') && !pathname.startsWith('/blog/seo'))
    return pathname === href || pathname.startsWith(href + '/')
  }

  const mainItems = NAV_ITEMS.filter(i => i.group === 'main')
  const contentItems = NAV_ITEMS.filter(i => i.group === 'content')

  function NavLink({ item }: { item: NavItem }) {
    const active = isActive(item.href)
    const isSupport = item.href === '/support'
    const ticketCount = isSupport ? count : 0

    return (
      <li>
        <Link
          href={item.href}
          aria-current={active ? 'page' : undefined}
          className={[
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
            active
              ? 'bg-indigo-500/15 text-indigo-300 shadow-sm'
              : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100',
          ].join(' ')}
        >
          {/* Active indicator */}
          <span className={`absolute left-0 h-5 w-0.5 rounded-r-full bg-indigo-400 transition-all ${active ? 'opacity-100' : 'opacity-0'}`} />
          <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">{item.label}</span>
          {isSupport && ticketCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold text-white">
              {ticketCount > 99 ? '99+' : ticketCount}
            </span>
          )}
        </Link>
      </li>
    )
  }

  return (
    <>
      {/* ── Desktop Sidebar (md+) ── */}
      <aside className="hidden md:flex h-full w-60 flex-col border-r border-zinc-800 bg-zinc-900 relative">
        {/* Brand */}
        <div className="flex items-center gap-3 border-b border-zinc-800 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-lg shadow-indigo-500/20">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-100">Freela Dock</p>
            <p className="text-xs text-zinc-500">Admin Portal</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Navegação principal">
          {/* Principal */}
          <div className="mb-4">
            <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              Principal
            </p>
            <ul className="flex flex-col gap-0.5 relative">
              {mainItems.map(item => (
                <NavLink key={item.href} item={item} />
              ))}
            </ul>
          </div>

          {/* Conteúdo */}
          <div>
            <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              Conteúdo
            </p>
            <ul className="flex flex-col gap-0.5 relative">
              {contentItems.map(item => (
                <NavLink key={item.href} item={item} />
              ))}
            </ul>
          </div>
        </nav>

        {/* Admin user widget + Sign out */}
        <div className="border-t border-zinc-800 p-3">
          <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-zinc-800/50 transition-colors cursor-default">
            <div
              aria-hidden="true"
              className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-xs font-bold text-white shadow-md"
            >
              {initials}
              {/* Status dot */}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-zinc-900 bg-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-zinc-200">{adminName}</p>
              <p className="truncate text-[10px] text-zinc-500">{adminEmail}</p>
            </div>
          </div>

          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* ── Mobile Bottom Navigation (<md) ── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-stretch border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-sm"
        aria-label="Navegação mobile"
      >
        {[...mainItems.slice(0, 4), ...contentItems.slice(0, 2)].map(({ href, shortLabel, icon: Icon }) => {
          const active = isActive(href)
          const isSupport = href === '/support'
          const ticketCount = isSupport ? count : 0

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={[
                'relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
                active ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300',
              ].join(' ')}
            >
              <span className="relative">
                <Icon className="h-5 w-5" aria-hidden="true" />
                {isSupport && ticketCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[9px] font-bold text-white leading-none">
                    {ticketCount > 99 ? '99+' : ticketCount}
                  </span>
                )}
              </span>
              <span>{shortLabel}</span>
              {active && (
                <span className="absolute top-0 inset-x-2 h-0.5 rounded-full bg-indigo-400" />
              )}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
