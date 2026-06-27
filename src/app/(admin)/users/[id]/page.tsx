import { createAdminClient } from '@/lib/supabase-admin'
import { requireAdminSession } from '@/lib/auth'
import { notFound } from 'next/navigation'
import UserActionButtons from '@/components/users/UserActionButtons'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', id)
    .single()
  return {
    title: data ? `${data.full_name} — Admin` : 'Usuário — Admin',
  }
}

const PLAN_LABEL: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  studio: 'Studio',
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Ativa',
  trialing: 'Em teste',
  past_due: 'Pagamento atrasado',
  canceled: 'Cancelada',
  incomplete: 'Incompleta',
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdminSession()
  const { id } = await params
  const supabase = createAdminClient()

  const [profileResult, subResult, countsResult, auditResult] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single(),
      supabase
        .from('subscriptions')
        .select('*')
        .eq('freelancer_id', id)
        .maybeSingle(),
      Promise.all([
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('freelancer_id', id),
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('freelancer_id', id),
        supabase.from('contracts').select('id', { count: 'exact', head: true }).eq('freelancer_id', id),
        supabase.from('proposals').select('id', { count: 'exact', head: true }).eq('freelancer_id', id),
        supabase.rpc('get_user_ai_metrics', { p_user_id: id }),
      ]),
      supabase
        .from('audit_logs')
        .select('id, action, payload, created_at, admin_id')
        .eq('target_id', id)
        .order('created_at', { ascending: false })
        .limit(20),
    ])

  if (profileResult.error || !profileResult.data) notFound()

  const profile = profileResult.data
  const sub = subResult.data
  const [projects, clients, contracts, proposals, aiMetricsResult] = countsResult
  const auditLogs = auditResult.data ?? []
  const aiMetrics = (aiMetricsResult.data as Record<string, number> | null)

  // Use the dedicated plan column (fast, no JSONB parsing needed)
  const plan = (profile as any).plan as string ?? 'free'

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-center justify-between border-b border-zinc-800 py-3 last:border-0">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm font-medium text-zinc-100">{value}</span>
    </div>
  )

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">{profile.full_name}</h1>
          <p className="mt-1 text-sm text-zinc-400">{profile.email}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            profile.is_active
              ? 'bg-emerald-600/10 text-emerald-400'
              : 'bg-red-600/10 text-red-400'
          }`}
        >
          {profile.is_active ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Info */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="mb-3 text-sm font-semibold text-zinc-300">Perfil</h2>
          <InfoRow label="ID" value={<span className="font-mono text-xs text-zinc-500">{profile.id}</span>} />
          <InfoRow label="Plano" value={PLAN_LABEL[plan] ?? plan} />
          <InfoRow
            label="Cadastrado em"
            value={new Date(profile.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit', month: 'long', year: 'numeric',
            })}
          />
          {profile.deleted_at && (
            <InfoRow
              label="Desativado em"
              value={new Date(profile.deleted_at).toLocaleDateString('pt-BR')}
            />
          )}
        </div>

        {/* Subscription */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="mb-3 text-sm font-semibold text-zinc-300">Assinatura</h2>
          {sub ? (
            <>
              <InfoRow label="Status" value={STATUS_LABEL[sub.status] ?? sub.status} />
              <InfoRow label="Plano" value={PLAN_LABEL[sub.plan_id] ?? sub.plan_id} />
              {sub.current_period_end && (
                <InfoRow
                  label="Próxima cobrança"
                  value={new Date(sub.current_period_end).toLocaleDateString('pt-BR')}
                />
              )}
              {sub.cancel_at_period_end && (
                <InfoRow label="Cancela no fim do período" value="Sim" />
              )}
            </>
          ) : (
            <p className="text-sm text-zinc-500">Sem assinatura ativa.</p>
          )}
        </div>

        {/* Usage counts */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="mb-3 text-sm font-semibold text-zinc-300">Uso da plataforma</h2>
          <InfoRow label="Projetos" value={projects.count ?? 0} />
          <InfoRow label="Clientes" value={clients.count ?? 0} />
          <InfoRow label="Contratos" value={contracts.count ?? 0} />
          <InfoRow label="Propostas" value={proposals.count ?? 0} />
          {aiMetrics && (
            <>
              <InfoRow
                label="Requisições IA"
                value={(aiMetrics.total_requests ?? 0).toLocaleString('pt-BR')}
              />
              <InfoRow
                label="Tokens usados"
                value={(
                  (aiMetrics.total_prompt ?? 0) + (aiMetrics.total_completion ?? 0)
                ).toLocaleString('pt-BR')}
              />
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-4 text-sm font-semibold text-zinc-300">Ações Administrativas</h2>
        <UserActionButtons
          userId={profile.id}
          isActive={profile.is_active}
          currentPlan={plan}
        />
      </div>

      {/* Audit log for this user */}
      {auditLogs.length > 0 && (
        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="mb-4 text-sm font-semibold text-zinc-300">
            Histórico de Ações ({auditLogs.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {auditLogs.map((log) => (
              <li
                key={log.id}
                className="flex items-center justify-between rounded-lg border border-zinc-800 px-4 py-3 text-sm"
              >
                <span className="font-mono text-indigo-400">{log.action}</span>
                <span className="text-zinc-500">
                  {new Date(log.created_at).toLocaleString('pt-BR')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
