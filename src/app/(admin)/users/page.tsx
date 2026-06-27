import { createAdminClient } from '@/lib/supabase-admin'
import { requireAdminSession } from '@/lib/auth'
import Link from 'next/link'
import { Users, Search, Filter, ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Usuários — Freela Dock Admin',
}

// Always fetch fresh data for admin pages
export const dynamic = 'force-dynamic'

const PLAN_BADGE: Record<string, { label: string; className: string }> = {
  free:    { label: 'Free',    className: 'bg-zinc-700 text-zinc-300' },
  starter: { label: 'Starter', className: 'bg-indigo-600/20 text-indigo-400' },
  pro:     { label: 'Pro',     className: 'bg-emerald-600/20 text-emerald-400' },
  studio:  { label: 'Studio',  className: 'bg-amber-500/20 text-amber-400' },
}

async function getUsers({
  search,
  plan,
  status,
  page,
}: {
  search?: string
  plan?: string
  status?: string
  page: number
}) {
  const supabase = createAdminClient()
  const PAGE_SIZE = 25
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('profiles')
    .select(
      'id, full_name, email, role, is_active, plan, created_at, business_info',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
  }
  if (plan && plan !== 'all') {
    // Server-side filter using the dedicated indexed plan column — O(log n)
    query = query.eq('plan', plan)
  }
  if (status === 'active') {
    query = query.eq('is_active', true)
  } else if (status === 'inactive') {
    query = query.eq('is_active', false)
  }

  const { data, count, error } = await query

  return { users: data ?? [], total: count ?? 0, pageSize: PAGE_SIZE }
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    plan?: string
    status?: string
    page?: string
  }>
}) {
  await requireAdminSession()

  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const { users, total, pageSize } = await getUsers({
    search: params.search,
    plan: params.plan,
    status: params.status,
    page,
  })

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
            <Users className="h-6 w-6 text-indigo-400" aria-hidden="true" />
            Usuários
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {total} freelancers cadastrados
          </p>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            name="search"
            type="search"
            defaultValue={params.search}
            placeholder="Buscar por nome ou email..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-500" aria-hidden="true" />
          <select
            name="plan"
            defaultValue={params.plan ?? 'all'}
            className="rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-3 pr-8 text-sm text-zinc-100 outline-none focus:border-indigo-500"
          >
            <option value="all">Todos os planos</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="studio">Studio</option>
          </select>

          <select
            name="status"
            defaultValue={params.status ?? 'all'}
            className="rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-3 pr-8 text-sm text-zinc-100 outline-none focus:border-indigo-500"
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>

        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          Filtrar
        </button>
      </form>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Usuário
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Plano
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Cadastro
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Ver
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-zinc-500">
                  Nenhum usuário encontrado para os filtros aplicados.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const badge = PLAN_BADGE[user.plan] ?? PLAN_BADGE.free
                return (
                  <tr key={user.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-zinc-100">{user.full_name}</p>
                        <p className="text-xs text-zinc-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          user.is_active
                            ? 'bg-emerald-600/10 text-emerald-400'
                            : 'bg-red-600/10 text-red-400'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${user.is_active ? 'bg-emerald-400' : 'bg-red-400'}`}
                        />
                        {user.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/users/${user.id}`}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-indigo-400 transition hover:bg-indigo-600/10"
                        aria-label={`Ver detalhes de ${user.full_name}`}
                      >
                        Detalhes
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-zinc-400">
          <span>
            Página {page} de {totalPages} ({total} usuários)
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/users?${new URLSearchParams({ ...params, page: String(page - 1) })}`}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs transition hover:bg-zinc-800"
              >
                Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/users?${new URLSearchParams({ ...params, page: String(page + 1) })}`}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs transition hover:bg-zinc-800"
              >
                Próxima
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
