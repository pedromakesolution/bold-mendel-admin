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
} from 'lucide-react'
import { signOut } from '@/app/actions/auth'
import { useTicketCountStore } from '@/stores/ticketCountStore'
import { useEffect } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', shortLabel: 'Dashboard', icon: LayoutDashboard },
  { href: '/users',     label: 'Usuários',  shortLabel: 'Usuários',  icon: Users           },
  { href: '/finance',   label: 'Financeiro',shortLabel: 'Financeiro',icon: BarChart2        },
  { href: '/audit',     label: 'Auditoria', shortLabel: 'Auditoria', icon: ClipboardList    },
  { href: '/support',   label: 'Suporte',   shortLabel: 'Suporte',   icon: LifeBuoy         },
  { href: '/blog',      label: 'Blog',      shortLabel: 'Blog',      icon: FileText         },
] as const

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

  // Hidrata o store com a contagem server-side na primeira renderização
  useEffect(() => {
    setCount(initialOpenTicketCount)
  }, [initialOpenTicketCount, setCount])

  // Derive initials for the avatar fallback
  const initials = adminName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <>
      {/* ── Desktop Sidebar (md+) ── */}
      <aside className="hidden md:flex h-full w-60 flex-col border-r border-zinc-800 bg-zinc-900">
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
              const active      = pathname === href || pathname.startsWith(href + '/')
              const isSupport   = href === '/support'
              const ticketCount = isSupport ? count : 0

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
                    <span className="flex-1">{label}</span>
                    {isSupport && ticketCount > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold text-white">
                        {ticketCount > 99 ? '99+' : ticketCount}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Admin user widget + Sign out */}
        <div className="border-t border-zinc-800 p-3">
          {/* Logged-in admin info */}
          <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
            <div
              aria-hidden="true"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-700 text-xs font-bold text-white"
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-zinc-200">{adminName}</p>
              <p className="truncate text-xs text-zinc-500">{adminEmail}</p>
            </div>
          </div>

          {/* Sign out */}
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
        className="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-stretch border-t border-zinc-800 bg-zinc-900"
        aria-label="Navegação mobile"
      >
        {NAV_ITEMS.map(({ href, shortLabel, icon: Icon }) => {
          const active      = pathname === href || pathname.startsWith(href + '/')
          const isSupport   = href === '/support'
          const ticketCount = isSupport ? count : 0

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={[
                'relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
                active
                  ? 'text-indigo-400'
                  : 'text-zinc-500 hover:text-zinc-300',
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
                <span className="absolute top-0 inset-x-3 h-0.5 rounded-full bg-indigo-500" />
              )}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
