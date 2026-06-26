import { createAdminClient } from '@/lib/supabase-admin'
import { requireAdminSession } from '@/lib/auth'
import { Users, TrendingUp, CreditCard, Activity } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard — Freela Dock Admin',
}

// Revalidate every 5 minutes — fresh enough without hammering the DB
export const revalidate = 300

async function getDashboardStats() {
  const supabase = createAdminClient()

  const [profilesResult, subsResult, metricsResult] = await Promise.all([
    // Total de usuários e breakdown por status
    supabase
      .from('profiles')
      .select('is_active', { count: 'exact', head: false })
      .select('is_active'),

    // Assinaturas ativas por plano
    supabase
      .from('subscriptions')
      .select('plan_id, status'),

    // Última métrica financeira registrada
    supabase
      .from('financial_metrics')
      .select('mrr_total, arr, churn_rate, active_subs, metric_date')
      .order('metric_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const profiles = profilesResult.data ?? []
  const totalUsers = profiles.length
  const activeUsers = profiles.filter((p) => p.is_active).length
  const inactiveUsers = totalUsers - activeUsers

  const subs = subsResult.data ?? []
  const activeSubs = subs.filter((s) => s.status === 'active' || s.status === 'trialing')
  const planBreakdown = {
    free: activeSubs.filter((s) => s.plan_id === 'free').length,
    starter: activeSubs.filter((s) => s.plan_id === 'starter').length,
    pro: activeSubs.filter((s) => s.plan_id === 'pro').length,
    studio: activeSubs.filter((s) => s.plan_id === 'studio').length,
  }

  const metrics = metricsResult.data

  return { totalUsers, activeUsers, inactiveUsers, planBreakdown, metrics }
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  accent: string
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-400">{label}</p>
        <span className={`rounded-lg p-2 ${accent}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-zinc-100">
        {value}
      </p>
      {sub && <p className="mt-1 text-sm text-zinc-500">{sub}</p>}
    </div>
  )
}

export default async function DashboardPage() {
  await requireAdminSession()
  const { totalUsers, activeUsers, inactiveUsers, planBreakdown, metrics } =
    await getDashboardStats()

  const mrr = metrics?.mrr_total
    ? `R$ ${Number(metrics.mrr_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : '—'

  const arr = metrics?.arr
    ? `R$ ${Number(metrics.arr).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : '—'

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Visão geral da plataforma Freela Dock
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total de Usuários"
          value={totalUsers}
          sub={`${activeUsers} ativos · ${inactiveUsers} inativos`}
          icon={Users}
          accent="bg-indigo-500/10 text-indigo-400"
        />
        <StatCard
          label="MRR"
          value={mrr}
          sub={metrics ? `Atualizado em ${metrics.metric_date}` : 'Sem dados ainda'}
          icon={TrendingUp}
          accent="bg-emerald-500/10 text-emerald-400"
        />
        <StatCard
          label="ARR"
          value={arr}
          sub="Receita Anual Recorrente"
          icon={CreditCard}
          accent="bg-sky-500/10 text-sky-400"
        />
        <StatCard
          label="Churn Rate (30d)"
          value={metrics ? `${metrics.churn_rate}%` : '—'}
          sub={`${metrics?.active_subs ?? '—'} assinaturas ativas`}
          icon={Activity}
          accent="bg-rose-500/10 text-rose-400"
        />
      </div>

      {/* Plan Distribution */}
      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-4 text-sm font-semibold text-zinc-300">
          Distribuição por Plano
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              { plan: 'Free', count: planBreakdown.free, color: 'bg-zinc-700' },
              { plan: 'Starter', count: planBreakdown.starter, color: 'bg-indigo-600' },
              { plan: 'Pro', count: planBreakdown.pro, color: 'bg-emerald-600' },
              { plan: 'Studio', count: planBreakdown.studio, color: 'bg-amber-500' },
            ] as const
          ).map(({ plan, count, color }) => (
            <div
              key={plan}
              className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950 p-4 gap-2"
            >
              <span className={`h-2 w-8 rounded-full ${color}`} />
              <span className="text-2xl font-bold text-zinc-100">{count}</span>
              <span className="text-xs font-medium text-zinc-500">{plan}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
