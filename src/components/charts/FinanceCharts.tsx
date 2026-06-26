'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'


type MetricSnapshot = {
  metric_date: string
  mrr_total: number
  arr: number
  active_subs: number
  churn_rate: number
  mrr_starter: number
  mrr_pro: number
  mrr_studio: number
}

interface FinanceChartsProps {
  history: MetricSnapshot[]
}

function brlTick(value: number) {
  return `R$ ${(value / 1000).toFixed(0)}k`
}

const TOOLTIP_STYLE = {
  backgroundColor: '#18181b',
  border: '1px solid #3f3f46',
  borderRadius: '8px',
  color: '#f4f4f5',
  fontSize: '12px',
}

export default function FinanceCharts({ history }: FinanceChartsProps) {
  if (history.length === 0) return null

  const formatted = history.map((d) => ({
    ...d,
    mrr_total:   Number(d.mrr_total),
    mrr_starter: Number(d.mrr_starter),
    mrr_pro:     Number(d.mrr_pro),
    mrr_studio:  Number(d.mrr_studio),
    churn_rate:  Number(d.churn_rate),
    // Short date label e.g. "26/06"
    label: d.metric_date.slice(5).split('-').reverse().join('/'),
  }))

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* MRR Line Chart */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-4 text-sm font-semibold text-zinc-300">
          MRR — Últimos {history.length} dias
        </h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={formatted} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#71717a', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={brlTick}
              tick={{ fill: '#71717a', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={56}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v) =>
                `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              }
            />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
            <Line
              type="monotone"
              dataKey="mrr_total"
              name="MRR Total"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* MRR by Plan Stacked Bar */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-4 text-sm font-semibold text-zinc-300">
          MRR por Plano — Últimos {history.length} dias
        </h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={formatted} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#71717a', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={brlTick}
              tick={{ fill: '#71717a', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={56}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v) =>
                `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              }
            />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
            <Bar dataKey="mrr_starter" name="Starter" stackId="mrr" fill="#6366f1" radius={[0,0,0,0]} />
            <Bar dataKey="mrr_pro"     name="Pro"     stackId="mrr" fill="#10b981" radius={[0,0,0,0]} />
            <Bar dataKey="mrr_studio"  name="Studio"  stackId="mrr" fill="#f59e0b" radius={[2,2,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Active Subscriptions Line Chart */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-4 text-sm font-semibold text-zinc-300">
          Assinaturas Ativas
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={formatted} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#71717a', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: '#71717a', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line
              type="monotone"
              dataKey="active_subs"
              name="Assinaturas"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Churn Rate Line Chart */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-4 text-sm font-semibold text-zinc-300">
          Churn Rate (%)
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={formatted} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#71717a', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: '#71717a', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={36}
              unit="%"
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v) => `${Number(v)}%`}
            />
            <Line
              type="monotone"
              dataKey="churn_rate"
              name="Churn"
              stroke="#f43f5e"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
