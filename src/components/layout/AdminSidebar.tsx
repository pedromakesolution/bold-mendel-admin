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
} from 'lucide-react'
import { signOut } from '@/app/actions/auth'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/users', label: 'Usuários', icon: Users },
  { href: '/finance', label: 'Financeiro', icon: BarChart2 },
  { href: '/audit', label: 'Auditoria', icon: ClipboardList },
] as const

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-60 flex-col border-r border-zinc-800 bg-zinc-900">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-zinc-800 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
          <Shield className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-100">Freela Dock</p>
          <p className="text-xs text-zinc-500">Admin Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Navegação principal">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-indigo-600/20 text-indigo-400'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100',
                  ].join(' ')}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Sign out */}
      <div className="border-t border-zinc-800 p-3">
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
  )
}
