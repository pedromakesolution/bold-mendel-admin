import { createAdminClient } from '@/lib/supabase-admin'
import { requireAdminSession } from '@/lib/auth'
import FinanceCharts from '@/components/charts/FinanceCharts'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Financeiro — Freela Dock Admin',
}

export const dynamic = 'force-dynamic'

async function getFinanceData() {
  const supabase = createAdminClient()

  // Last 90 days of daily snapshots for the line chart
  const { data: history } = await supabase
    .from('financial_metrics')
    .select('metric_date, mrr_total, arr, active_subs, churn_rate, new_subs_30d, churned_30d, mrr_free, mrr_starter, mrr_pro, mrr_studio')
    .order('metric_date', { ascending: true })
    .limit(90)

  // Latest snapshot for the KPI cards
  const latest = history && history.length > 0 ? history[history.length - 1] : null

  return { history: history ?? [], latest }
}

function fmt(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })
}

export default async function FinancePage() {
  await requireAdminSession()
  const { history, latest } = await getFinanceData()

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Financeiro</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Métricas calculadas diariamente às 00:00 BRT
            {latest && (
              <span className="ml-2 text-zinc-600">
                · Última atualização: {latest.metric_date}
              </span>
            )}
          </p>
        </div>
        <RecalculateButton />
      </div>

      {!latest ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-12 text-center">
          <p className="text-zinc-400">
            Nenhuma métrica disponível ainda. A primeira atualização ocorrerá às 00:00 BRT.
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            Você pode forçar o cálculo agora clicando em &quot;Recalcular Agora&quot;.
          </p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
            {(
              [
                { label: 'MRR', value: fmt(Number(latest.mrr_total)), sub: 'Receita Mensal Recorrente' },
                { label: 'ARR', value: fmt(Number(latest.arr)), sub: 'Receita Anual Recorrente' },
                { label: 'Assinaturas Ativas', value: latest.active_subs.toString(), sub: `+${latest.new_subs_30d} nos últimos 30d` },
                { label: 'Churn Rate (30d)', value: `${latest.churn_rate}%`, sub: `${latest.churned_30d} cancelamentos` },
              ] as const
            ).map(({ label, value, sub }) => (
              <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
                <p className="mt-2 text-2xl font-bold text-zinc-100">{value}</p>
                <p className="mt-1 text-xs text-zinc-500">{sub}</p>
              </div>
            ))}
          </div>

          {/* Plan MRR Breakdown */}
          <div className="grid gap-4 lg:grid-cols-3 mb-6">
            {(
              [
                { plan: 'Starter', value: Number(latest.mrr_starter), color: 'bg-indigo-600' },
                { plan: 'Pro',     value: Number(latest.mrr_pro),     color: 'bg-emerald-600' },
                { plan: 'Studio',  value: Number(latest.mrr_studio),  color: 'bg-amber-500' },
              ] as const
            ).map(({ plan, value, color }) => {
              const total = Number(latest.mrr_total) || 1
              const pct = ((value / total) * 100).toFixed(1)
              return (
                <div key={plan} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-zinc-300">{plan}</span>
                    <span className="text-sm text-zinc-500">{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-zinc-800">
                    <div
                      className={`h-1.5 rounded-full ${color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-lg font-bold text-zinc-100">{fmt(value)}</p>
                </div>
              )
            })}
          </div>

          {/* Historical Charts — Client Component */}
          <FinanceCharts history={history} />
        </>
      )}
    </div>
  )
}

// Inline Client Component for the recalculate button to keep the page Server
function RecalculateButton() {
  return (
    <form
      action={async () => {
        'use server'
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/calculate-financial-metrics`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        )
        if (!res.ok) {
          console.error('[recalculate] Failed:', await res.text())
        }
      }}
    >
      <button
        type="submit"
        className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-700"
      >
        Recalcular Agora
      </button>
    </form>
  )
}
