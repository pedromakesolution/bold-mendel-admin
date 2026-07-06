import { createAdminClient } from '@/lib/supabase-admin'
import { requireAdminSession } from '@/lib/auth'
import Link from 'next/link'
import { LifeBuoy, AlertCircle, ChevronRight, Clock } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Suporte — Freela Dock Admin',
}

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = {
  open:         'Aberto',
  in_progress:  'Em andamento',
  waiting_user: 'Aguardando usuário',
  resolved:     'Resolvido',
  closed:       'Fechado',
}

const STATUS_STYLE: Record<string, string> = {
  open:         'bg-blue-500/10 text-blue-400 border-blue-500/20',
  in_progress:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  waiting_user: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  resolved:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  closed:       'bg-zinc-700/30 text-zinc-500 border-zinc-700/30',
}

const CATEGORY_LABEL: Record<string, string> = {
  bug:             '🐛 Bug',
  question:        '💬 Dúvida',
  feature_request: '✨ Sugestão',
  billing:         '💳 Cobrança',
  other:           '📋 Outro',
}

const PRIORITY_STYLE: Record<string, string> = {
  low:    'text-zinc-500',
  normal: 'text-zinc-400',
  high:   'text-amber-400',
  urgent: 'text-rose-400',
}

const PRIORITY_LABEL: Record<string, string> = {
  low:    'Baixa',
  normal: 'Normal',
  high:   'Alta',
  urgent: 'Urgente ⚠️',
}

const PAGE_SIZE = 25

async function getTickets({
  status,
  category,
  search,
  page,
}: {
  status?: string
  category?: string
  search?: string
  page: number
}) {
  const supabase = createAdminClient()
  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  let query = supabase
    .from('support_tickets')
    .select(
      `id, subject, category, priority, status, created_at, updated_at,
       assigned_admin_id, attachments,
       user:profiles!support_tickets_user_id_fkey(full_name, email, plan)`,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status && status !== 'all')   query = query.eq('status', status)
  if (category && category !== 'all') query = query.eq('category', category)
  if (search) {
    query = query.or(`subject.ilike.%${search}%`)
  }

  return query
}

function isStale(createdAt: string): boolean {
  const ms = Date.now() - new Date(createdAt).getTime()
  return ms > 24 * 60 * 60 * 1000 // mais de 24h
}

export default async function SupportListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  await requireAdminSession()
  const params   = await searchParams
  const page     = Number(params.page ?? '1')
  const status   = params.status
  const category = params.category
  const search   = params.search

  const { data: tickets, count, error } = await getTickets({ status, category, search, page })

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8 flex items-center gap-3">
        <LifeBuoy className="h-5 w-5 text-indigo-400 md:h-6 md:w-6" />
        <div>
          <h1 className="text-xl font-bold text-zinc-100 md:text-2xl">Suporte</h1>
          <p className="text-sm text-zinc-400">
            {count ?? 0} ticket{count !== 1 ? 's' : ''} encontrado{count !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <input
          name="search"
          defaultValue={search}
          placeholder="Buscar por assunto..."
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-indigo-500 sm:w-auto sm:flex-1"
        />

        <div className="flex gap-2">
          <select
            name="status"
            defaultValue={status ?? 'all'}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
          >
            <option value="all">Todos os status</option>
            {Object.entries(STATUS_LABEL).map(([val, lbl]) => (
              <option key={val} value={val}>{lbl}</option>
            ))}
          </select>

          <select
            name="category"
            defaultValue={category ?? 'all'}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
          >
            <option value="all">Todas</option>
            {Object.entries(CATEGORY_LABEL).map(([val, lbl]) => (
              <option key={val} value={val}>{lbl}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors sm:flex-none"
          >
            Filtrar
          </button>

          {(status || category || search) && (
            <Link
              href="/support"
              className="flex-1 rounded-lg border border-zinc-700 px-4 py-2 text-center text-sm text-zinc-400 hover:text-zinc-100 transition-colors sm:flex-none"
            >
              Limpar
            </Link>
          )}
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Erro ao carregar tickets: {error.message}
        </div>
      )}

      {/* ── Mobile: card list (<md) ── */}
      {!tickets || tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 py-20 text-center">
          <LifeBuoy className="h-10 w-10 text-zinc-700 mb-3" />
          <p className="text-zinc-500">Nenhum ticket encontrado</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden flex flex-col gap-2">
            {tickets.map((ticket) => {
              const stale = isStale(ticket.created_at) &&
                !['resolved', 'closed'].includes(ticket.status)
              const user = ticket.user as any

              return (
                <Link
                  key={ticket.id}
                  href={`/support/${ticket.id}`}
                  className="flex items-start justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 transition-colors hover:bg-zinc-800/60 gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      {stale && (
                        <Clock className="h-3.5 w-3.5 shrink-0 text-amber-400" aria-label="Sem resposta há mais de 24h" />
                      )}
                      <p className="truncate font-medium text-zinc-100 text-sm">{ticket.subject}</p>
                    </div>
                    <p className="text-xs text-zinc-500 mb-2">{CATEGORY_LABEL[ticket.category]}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLE[ticket.status]}`}>
                        {STATUS_LABEL[ticket.status]}
                      </span>
                      <span className={`text-xs font-medium ${PRIORITY_STYLE[ticket.priority]}`}>
                        {PRIORITY_LABEL[ticket.priority]}
                      </span>
                    </div>
                    {user?.full_name && (
                      <p className="mt-1.5 text-xs text-zinc-500 truncate">{user.full_name}</p>
                    )}
                  </div>
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" />
                </Link>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">Ticket</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">Usuário</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">Prioridade</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">Responsável</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">Data</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-zinc-950">
                {tickets.map((ticket) => {
                  const stale = isStale(ticket.created_at) &&
                    !['resolved', 'closed'].includes(ticket.status)
                  const user = ticket.user as any

                  return (
                    <tr
                      key={ticket.id}
                      className="hover:bg-zinc-900/60 transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {stale && (
                            <span title="Sem resposta há mais de 24h" aria-label="Sem resposta há mais de 24h">
                              <Clock className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                            </span>
                          )}
                          <div>
                            <p className="font-medium text-zinc-100 truncate max-w-[220px]">
                              {ticket.subject}
                            </p>
                            <p className="text-xs text-zinc-500">{CATEGORY_LABEL[ticket.category]}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-zinc-200">{user?.full_name ?? '—'}</p>
                        <p className="text-xs text-zinc-500">{user?.email ?? ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLE[ticket.status]}`}>
                          {STATUS_LABEL[ticket.status]}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-xs font-medium ${PRIORITY_STYLE[ticket.priority]}`}>
                        {PRIORITY_LABEL[ticket.priority]}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {ticket.assigned_admin_id ? '✓ Atribuído' : 'Não atribuído'}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/support/${ticket.id}`}
                          className="text-indigo-400 hover:text-indigo-300 transition-colors"
                          aria-label={`Ver ticket ${ticket.subject}`}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/support?page=${p}${status ? `&status=${status}` : ''}${category ? `&category=${category}` : ''}${search ? `&search=${search}` : ''}`}
              className={[
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                p === page
                  ? 'bg-indigo-600 text-white'
                  : 'border border-zinc-700 text-zinc-400 hover:text-zinc-100',
              ].join(' ')}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
