import { createAdminClient } from '@/lib/supabase-admin'
import { requireAdminSession } from '@/lib/auth'
import { getSiteMetrics } from '@/lib/google-search-console'
import { Users, TrendingUp, CreditCard, Activity, MousePointerClick, Eye, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard — Freela Dock Admin',
}

export const revalidate = 300

async function getDashboardStats() {
  const supabase = createAdminClient()

  const [profilesResult, metricsResult] = await Promise.all([
    supabase.from('profiles').select('is_active, business_info'),
    supabase
      .from('financial_metrics')
      .select('mrr_total, arr, churn_rate, active_subs, metric_date')
      .order('metric_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const profiles = profilesResult.data ?? []
  const totalUsers = profiles.length

  let activeUsers = 0
  let inactiveUsers = 0
  const planBreakdown = { free: 0, starter: 0, pro: 0, studio: 0 }

  for (const p of profiles) {
    if (p.is_active) {
      activeUsers++
      const bizInfo = p.business_info as Record<string, any> | null
      const plan = bizInfo?.plan ?? 'free'
      if (plan === 'starter') planBreakdown.starter++
      else if (plan === 'pro') planBreakdown.pro++
      else if (plan === 'studio') planBreakdown.studio++
      else planBreakdown.free++
    } else {
      inactiveUsers++
    }
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
  border,
  bg,
  href,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  accent: string
  border: string
  bg: string
  href?: string
}) {
  const content = (
    <div className={`metric-card rounded-xl border ${border} bg-zinc-900/80 p-5 backdrop-blur-sm h-full`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}>
          <Icon className={`h-4 w-4 ${accent}`} />
        </span>
      </div>
      <p className={`text-3xl font-bold tracking-tight ${accent}`}>{value}</p>
      {sub && <p className="mt-1.5 text-xs text-zinc-500">{sub}</p>}
      {href && (
        <div className="mt-3 flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
          Ver detalhes <ArrowUpRight className="h-3 w-3" />
        </div>
      )}
    </div>
  )

  if (href) {
    return <Link href={href} className="block h-full">{content}</Link>
  }
  return content
}

// Gráfico de barras SVG inline para distribuição de planos
function PlanBarsChart({
  plans,
  total,
}: {
  plans: { name: string; count: number; color: string; textColor: string }[]
  total: number
}) {
  const maxCount = Math.max(...plans.map(p => p.count), 1)

  return (
    <div className="space-y-3">
      {plans.map(({ name, count, color, textColor }) => {
        const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
        const barW = maxCount > 0 ? (count / maxCount) * 100 : 0
        return (
          <div key={name}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${color}`} />
                <span className="text-sm text-zinc-300 font-medium">{name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={`font-bold ${textColor}`}>{count}</span>
                <span className="text-zinc-600">({pct}%)</span>
              </div>
            </div>
            <div className="progress-track">
              <div
                className={`progress-fill ${color}`}
                style={{ width: `${barW}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default async function DashboardPage() {
  await requireAdminSession()
  const [
    { totalUsers, activeUsers, inactiveUsers, planBreakdown, metrics },
    gscMetrics,
  ] = await Promise.all([getDashboardStats(), getSiteMetrics()])

  const mrr = metrics?.mrr_total
    ? `R$ ${Number(metrics.mrr_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : '—'

  const arr = metrics?.arr
    ? `R$ ${Number(metrics.arr).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : '—'

  const plans = [
    { name: 'Free',    count: planBreakdown.free,    color: 'bg-zinc-500',   textColor: 'text-zinc-300' },
    { name: 'Starter', count: planBreakdown.starter, color: 'bg-indigo-600', textColor: 'text-indigo-300' },
    { name: 'Pro',     count: planBreakdown.pro,     color: 'bg-emerald-600',textColor: 'text-emerald-300' },
    { name: 'Studio',  count: planBreakdown.studio,  color: 'bg-amber-500',  textColor: 'text-amber-300' },
  ]

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      {/* ── Cabeçalho ── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Visão geral da plataforma Freela Dock
          {metrics?.metric_date && (
            <span className="ml-2 text-zinc-600">· Métricas de {metrics.metric_date}</span>
          )}
        </p>
      </div>

      {/* ── KPI Cards — Usuários & Financeiro ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          label="Total de Usuários"
          value={totalUsers}
          sub={`${activeUsers} ativos · ${inactiveUsers} inativos`}
          icon={Users}
          accent="text-indigo-400"
          border="border-indigo-500/20"
          bg="bg-indigo-500/10"
          href="/users"
        />
        <StatCard
          label="MRR"
          value={mrr}
          sub={metrics ? `Atualizado em ${metrics.metric_date}` : 'Sem dados ainda'}
          icon={TrendingUp}
          accent="text-emerald-400"
          border="border-emerald-500/20"
          bg="bg-emerald-500/10"
          href="/finance"
        />
        <StatCard
          label="ARR"
          value={arr}
          sub="Receita Anual Recorrente"
          icon={CreditCard}
          accent="text-sky-400"
          border="border-sky-500/20"
          bg="bg-sky-500/10"
          href="/finance"
        />
        <StatCard
          label="Churn Rate (30d)"
          value={metrics ? `${metrics.churn_rate}%` : '—'}
          sub={`${metrics?.active_subs ?? '—'} assinaturas ativas`}
          icon={Activity}
          accent="text-rose-400"
          border="border-rose-500/20"
          bg="bg-rose-500/10"
        />
      </div>

      {/* ── Segunda linha: Planos + GSC ── */}
      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        {/* Distribuição por Plano */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-200">Distribuição por Plano</h2>
            <Link href="/users" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              Ver usuários →
            </Link>
          </div>
          <PlanBarsChart plans={plans} total={activeUsers} />
        </div>

        {/* Google Search Console mini */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-200">Tráfego Orgânico (28d)</h2>
            <Link href="/blog/seo" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
              Analytics completo <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {gscMetrics ? (
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  label: 'Cliques',
                  value: gscMetrics.clicks.toLocaleString('pt-BR'),
                  icon: MousePointerClick,
                  color: 'text-indigo-400',
                  sub: 'Google Search',
                },
                {
                  label: 'Impressões',
                  value: gscMetrics.impressions.toLocaleString('pt-BR'),
                  icon: Eye,
                  color: 'text-sky-400',
                  sub: 'Exibições',
                },
                {
                  label: 'CTR Médio',
                  value: `${(gscMetrics.ctr * 100).toFixed(2)}%`,
                  icon: TrendingUp,
                  color: 'text-emerald-400',
                  sub: 'Taxa de cliques',
                },
                {
                  label: 'Posição Média',
                  value: gscMetrics.position.toFixed(1),
                  icon: Activity,
                  color: 'text-amber-400',
                  sub: 'Ranking Google',
                },
              ].map(({ label, value, icon: Icon, color, sub }) => (
                <div key={label} className="rounded-lg bg-zinc-800/50 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className={`h-3.5 w-3.5 ${color}`} />
                    <span className="text-xs text-zinc-500">{label}</span>
                  </div>
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                  <p className="text-[10px] text-zinc-600">{sub}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-zinc-600">
              <p className="text-sm">GSC não configurado</p>
              <p className="text-xs mt-1">Configure as credenciais no .env</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
