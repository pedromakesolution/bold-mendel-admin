import { createAdminClient } from '@/lib/supabase-admin'
import { requireAdminSession } from '@/lib/auth'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Auditoria — Freela Dock Admin',
}

export const dynamic = 'force-dynamic'

const ACTION_LABEL: Record<string, { label: string; className: string }> = {
  deactivate_user: { label: 'Conta desativada',    className: 'text-red-400' },
  reactivate_user: { label: 'Conta reativada',     className: 'text-emerald-400' },
  reset_password:  { label: 'Reset de senha',       className: 'text-yellow-400' },
  change_plan:     { label: 'Plano alterado',       className: 'text-indigo-400' },
  anonymize_user:  { label: 'Dados anonimizados',  className: 'text-red-500' },
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    action?: string
    date_from?: string
    date_to?: string
  }>
}) {
  await requireAdminSession()

  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const PAGE_SIZE = 50
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = createAdminClient()

  // ── Fetch logs with admin name via join ──────────────────────────────────────
  // We resolve admin names by fetching profiles for admin_id values found in logs.
  let query = supabase
    .from('audit_logs')
    .select('id, action, target_type, target_id, payload, created_at, admin_id', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (params.action && params.action !== 'all') {
    query = query.eq('action', params.action)
  }
  if (params.date_from) {
    query = query.gte('created_at', params.date_from)
  }
  if (params.date_to) {
    // Include the full day
    query = query.lte('created_at', `${params.date_to}T23:59:59Z`)
  }

  const { data: logs, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  // ── Resolve admin names in one batch query ───────────────────────────────────
  const adminIds = [...new Set((logs ?? []).map((l) => l.admin_id))]
  const targetIds = [...new Set((logs ?? [])
    .filter((l) => l.target_type === 'profile')
    .map((l) => String(l.target_id)))]

  const [adminProfiles, targetProfiles] = await Promise.all([
    adminIds.length > 0
      ? supabase.from('profiles').select('id, full_name').in('id', adminIds)
      : { data: [] },
    targetIds.length > 0
      ? supabase.from('profiles').select('id, full_name, email').in('id', targetIds)
      : { data: [] },
  ])

  const adminMap = new Map(
    (adminProfiles.data ?? []).map((p) => [p.id, p.full_name])
  )
  const targetMap = new Map(
    (targetProfiles.data ?? []).map((p) => [p.id, { name: p.full_name, email: p.email }])
  )

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">Auditoria</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Histórico completo de ações administrativas
        </p>
      </div>

      {/* Filters */}
      <form method="GET" className="mb-6 flex flex-wrap items-center gap-3">
        {/* Action type */}
        <select
          name="action"
          defaultValue={params.action ?? 'all'}
          className="rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-3 pr-8 text-sm text-zinc-100 outline-none focus:border-indigo-500"
        >
          <option value="all">Todas as ações</option>
          {Object.entries(ACTION_LABEL).map(([value, { label }]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {/* Date range */}
        <input
          name="date_from"
          type="date"
          defaultValue={params.date_from}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
          aria-label="Data inicial"
        />
        <span className="text-sm text-zinc-600">até</span>
        <input
          name="date_to"
          type="date"
          defaultValue={params.date_to}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
          aria-label="Data final"
        />

        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          Filtrar
        </button>
        {(params.action || params.date_from || params.date_to) && (
          <a
            href="/audit"
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition hover:bg-zinc-800"
          >
            Limpar
          </a>
        )}
      </form>

      {/* Log table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Ação</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Usuário afetado</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Detalhes</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Admin</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Data/hora</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {(logs ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-zinc-500">
                  Nenhum log de auditoria encontrado.
                </td>
              </tr>
            ) : (
              (logs ?? []).map((log) => {
                const payload = log.payload as Record<string, unknown>
                const actionMeta = ACTION_LABEL[log.action]
                const targetInfo = targetMap.get(String(log.target_id))
                const adminName = adminMap.get(log.admin_id) ?? 'Admin desconhecido'

                let detail = ''
                if (log.action === 'change_plan') {
                  detail = `${payload.from} → ${payload.to}`
                } else if (log.action === 'anonymize_user') {
                  detail = `${payload.original_email}`
                } else if (log.action === 'deactivate_user') {
                  detail = 'Ban permanente aplicado'
                } else if (log.action === 'reset_password') {
                  detail = String(payload.email ?? '')
                }

                return (
                  <tr key={log.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`font-mono text-xs ${actionMeta?.className ?? 'text-zinc-400'}`}>
                        {log.action}
                      </span>
                      <p className="text-zinc-300">{actionMeta?.label ?? log.action}</p>
                    </td>
                    <td className="px-4 py-3">
                      {targetInfo ? (
                        <Link
                          href={`/users/${log.target_id}`}
                          className="group flex flex-col"
                        >
                          <span className="font-medium text-zinc-200 group-hover:text-indigo-400 transition-colors">
                            {targetInfo.name}
                          </span>
                          <span className="text-xs text-zinc-500">{targetInfo.email}</span>
                        </Link>
                      ) : (
                        <span className="font-mono text-xs text-zinc-500">
                          {String(log.target_id).slice(0, 12)}…
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">
                      {detail || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-zinc-400">{adminName}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400 text-xs">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
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
          <span>Página {page} de {totalPages} ({count} registros)</span>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`/audit?${new URLSearchParams({ ...params, page: String(page - 1) })}`}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-800"
              >
                Anterior
              </a>
            )}
            {page < totalPages && (
              <a
                href={`/audit?${new URLSearchParams({ ...params, page: String(page + 1) })}`}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-800"
              >
                Próxima
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
