import { createAdminClient } from '@/lib/supabase-admin'
import { requireAdminSession } from '@/lib/auth'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Auditoria — Freela Dock Admin',
}

export const dynamic = 'force-dynamic'

const ACTION_LABEL: Record<string, string> = {
  deactivate_user: 'Conta desativada',
  reactivate_user: 'Conta reativada',
  reset_password:  'Reset de senha',
  change_plan:     'Plano alterado',
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string }>
}) {
  await requireAdminSession()

  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const PAGE_SIZE = 50
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = createAdminClient()

  let query = supabase
    .from('audit_logs')
    .select('id, action, target_type, target_id, payload, created_at, admin_id', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (params.action && params.action !== 'all') {
    query = query.eq('action', params.action)
  }

  const { data: logs, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">Auditoria</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Histórico completo de ações administrativas
        </p>
      </div>

      {/* Filter */}
      <form method="GET" className="mb-6 flex items-center gap-3">
        <select
          name="action"
          defaultValue={params.action ?? 'all'}
          className="rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-3 pr-8 text-sm text-zinc-100 outline-none focus:border-indigo-500"
        >
          <option value="all">Todas as ações</option>
          {Object.entries(ACTION_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          Filtrar
        </button>
      </form>

      {/* Log table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Ação</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Alvo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Detalhes</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Data/hora</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {(logs ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-zinc-500">
                  Nenhum log de auditoria encontrado.
                </td>
              </tr>
            ) : (
              (logs ?? []).map((log) => {
                const payload = log.payload as Record<string, unknown>
                let detail = ''
                if (log.action === 'change_plan') {
                  detail = `${payload.from} → ${payload.to}`
                } else if (log.action === 'deactivate_user') {
                  detail = 'Ban de 876000h aplicado'
                }

                return (
                  <tr key={log.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-indigo-400">
                        {log.action}
                      </span>
                      <p className="text-zinc-300">{ACTION_LABEL[log.action] ?? log.action}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-zinc-500">
                        {String(log.target_id).slice(0, 8)}…
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {detail || '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400">
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
          <span>Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={`/audit?page=${page - 1}`} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-800">
                Anterior
              </a>
            )}
            {page < totalPages && (
              <a href={`/audit?page=${page + 1}`} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-800">
                Próxima
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
