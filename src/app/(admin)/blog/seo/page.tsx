import Link from 'next/link'
import {
  ArrowLeft, BarChart3, MousePointerClick, Eye, Target,
  TrendingUp, Search, ExternalLink, ArrowUpDown,
} from 'lucide-react'
import { getSiteMetrics, getAllPostsMetrics, getTopQueries, getDailyMetrics } from '@/lib/google-search-console'
import { createBlogAdminClient } from '@/lib/blog-admin-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'SEO Analytics — Freela Dock Admin' }

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://freeladock.com.br'

// Períodos disponíveis
const PERIODS = [
  { label: '7 dias',  days: 7  },
  { label: '28 dias', days: 28 },
  { label: '90 dias', days: 90 },
] as const

type Period = typeof PERIODS[number]['days']

function getDateRange(days: number) {
  const today = new Date()
  const endDate = today.toISOString().split('T')[0]
  const startDate = new Date(today.setDate(today.getDate() - days)).toISOString().split('T')[0]
  return { startDate, endDate }
}

/** Badge de posição colorido */
function PosBadge({ pos }: { pos: number }) {
  if (pos === 0) return <span className="text-zinc-600">—</span>
  if (pos <= 3)  return <span className="gsc-badge-excellent">#{pos.toFixed(1)}</span>
  if (pos <= 10) return <span className="gsc-badge-good">#{pos.toFixed(1)}</span>
  if (pos <= 20) return <span className="gsc-badge-fair">#{pos.toFixed(1)}</span>
  return <span className="text-zinc-500 text-xs">#{pos.toFixed(0)}</span>
}

/** Mini bar de progresso inline */
function MiniBar({ value, max, color = 'bg-indigo-500' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-zinc-800 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default async function SeoAnalyticsPage(props: {
  searchParams: Promise<{ period?: string; sort?: string }>
}) {
  const searchParams = await props.searchParams
  const periodDays = Number(searchParams?.period || '28') as Period
  const sortBy = (searchParams?.sort || 'clicks') as 'clicks' | 'impressions' | 'ctr' | 'position'
  const validPeriod = PERIODS.find(p => p.days === periodDays)?.days ?? 28
  const { startDate, endDate } = getDateRange(validPeriod)

  // Busca todos os dados em paralelo
  const [siteMetrics, allPostsMetrics, topQueries, dailyMetrics, { data: posts }] = await Promise.all([
    getSiteMetrics(startDate, endDate),
    getAllPostsMetrics(startDate, endDate),
    getTopQueries(startDate, endDate, 20),
    getDailyMetrics(startDate, endDate),
    createBlogAdminClient()
      .from('posts')
      .select('id, slug, title, status, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false }),
  ])

  // Monta tabela de artigos com métricas GSC
  const articleRows = (posts ?? []).map(post => {
    const gsc = allPostsMetrics.get(post.slug) ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 }
    return { ...post, ...gsc }
  })

  // Ordena
  const sorted = [...articleRows].sort((a, b) => {
    if (sortBy === 'position') return (a.position || 999) - (b.position || 999)
    return (b[sortBy] || 0) - (a[sortBy] || 0)
  })

  // Máximos para mini bars
  const maxClicks = Math.max(...sorted.map(r => r.clicks), 1)
  const maxImpressions = Math.max(...sorted.map(r => r.impressions), 1)

  // Micro sparkline de cliques (últimos 14 dias)
  const recentDays = dailyMetrics.slice(-14)
  const maxDayClicks = Math.max(...recentDays.map(d => d.clicks), 1)
  const sparkPoints = recentDays.map((d, i) => {
    const x = (i / (recentDays.length - 1)) * 200
    const y = 30 - (d.clicks / maxDayClicks) * 28
    return `${x},${y}`
  }).join(' ')

  function sortLink(field: string) {
    const params = new URLSearchParams({ period: String(validPeriod), sort: field })
    return `/blog/seo?${params.toString()}`
  }

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      {/* ── Cabeçalho ── */}
      <div className="mb-8">
        <Link
          href="/blog"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Blog
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold text-zinc-100">SEO Analytics</h1>
            </div>
            <p className="text-sm text-zinc-400 ml-12">
              Google Search Console · freeladock.com.br
            </p>
          </div>

          {/* Seletor de período */}
          <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
            {PERIODS.map(({ label, days }) => (
              <Link
                key={days}
                href={`/blog/seo?period=${days}&sort=${sortBy}`}
                className={[
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                  validPeriod === days
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200',
                ].join(' ')}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI Cards globais ── */}
      {siteMetrics && (
        <div className="mb-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: 'Total de Cliques',
              value: siteMetrics.clicks.toLocaleString('pt-BR'),
              icon: MousePointerClick,
              accent: 'text-indigo-400',
              bg: 'bg-indigo-500/10',
              border: 'border-indigo-500/20',
              sub: 'Visitas orgânicas',
            },
            {
              label: 'Impressões',
              value: siteMetrics.impressions.toLocaleString('pt-BR'),
              icon: Eye,
              accent: 'text-sky-400',
              bg: 'bg-sky-500/10',
              border: 'border-sky-500/20',
              sub: 'Exibições no Google',
            },
            {
              label: 'CTR Médio',
              value: `${(siteMetrics.ctr * 100).toFixed(2)}%`,
              icon: Target,
              accent: 'text-emerald-400',
              bg: 'bg-emerald-500/10',
              border: 'border-emerald-500/20',
              sub: 'Taxa de cliques',
            },
            {
              label: 'Posição Média',
              value: siteMetrics.position.toFixed(1),
              icon: BarChart3,
              accent: 'text-amber-400',
              bg: 'bg-amber-500/10',
              border: 'border-amber-500/20',
              sub: 'Ranking Google',
            },
          ].map(({ label, value, icon: Icon, accent, bg, border, sub }) => (
            <div key={label} className={`metric-card rounded-xl border ${border} bg-zinc-900/80 p-5 backdrop-blur-sm`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}>
                  <Icon className={`h-4 w-4 ${accent}`} />
                </span>
              </div>
              <p className={`text-2xl font-bold ${accent}`}>{value}</p>
              <p className="mt-1 text-xs text-zinc-600">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Sparkline de Cliques Diários ── */}
      {recentDays.length > 1 && (
        <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-200">Cliques Diários</h2>
            <span className="text-xs text-zinc-500">Últimos {recentDays.length} dias</span>
          </div>
          <div className="relative">
            <svg viewBox="0 0 200 35" className="w-full h-20 overflow-visible" preserveAspectRatio="none">
              {/* Grid lines */}
              {[0, 1, 2].map(i => (
                <line
                  key={i}
                  x1="0" y1={10 + i * 12}
                  x2="200" y2={10 + i * 12}
                  stroke="rgb(63 63 70 / 0.4)"
                  strokeWidth="0.5"
                />
              ))}
              {/* Area fill */}
              <defs>
                <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(99 102 241 / 0.3)" />
                  <stop offset="100%" stopColor="rgb(99 102 241 / 0.01)" />
                </linearGradient>
              </defs>
              {sparkPoints && (
                <>
                  <polygon
                    points={`0,35 ${sparkPoints} 200,35`}
                    fill="url(#sparkGrad)"
                  />
                  <polyline
                    points={sparkPoints}
                    fill="none"
                    stroke="rgb(99 102 241)"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </>
              )}
            </svg>
            {/* Labels dos dias no rodapé */}
            <div className="flex justify-between mt-1 text-[10px] text-zinc-600">
              <span>{recentDays[0]?.date?.slice(5)}</span>
              <span>{recentDays[recentDays.length - 1]?.date?.slice(5)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Tabela de Artigos Únicos (2/3) ── */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
            <div className="border-b border-zinc-800 px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-200">Artigos Publicados</h2>
                <p className="text-xs text-zinc-500 mt-0.5">{sorted.length} artigos com métricas GSC</p>
              </div>
              <span className="text-xs text-zinc-600">Ordenado por {sortBy}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wider text-zinc-500">
                    <th className="px-4 py-3 font-medium">Artigo</th>
                    <th className="px-4 py-3 font-medium">
                      <Link href={sortLink('clicks')} className={`flex items-center gap-1 hover:text-zinc-300 ${sortBy === 'clicks' ? 'text-indigo-400' : ''}`}>
                        Cliques <ArrowUpDown className="h-3 w-3" />
                      </Link>
                    </th>
                    <th className="px-4 py-3 font-medium">
                      <Link href={sortLink('impressions')} className={`flex items-center gap-1 hover:text-zinc-300 ${sortBy === 'impressions' ? 'text-indigo-400' : ''}`}>
                        Impressões <ArrowUpDown className="h-3 w-3" />
                      </Link>
                    </th>
                    <th className="px-4 py-3 font-medium">
                      <Link href={sortLink('ctr')} className={`flex items-center gap-1 hover:text-zinc-300 ${sortBy === 'ctr' ? 'text-indigo-400' : ''}`}>
                        CTR <ArrowUpDown className="h-3 w-3" />
                      </Link>
                    </th>
                    <th className="px-4 py-3 font-medium">
                      <Link href={sortLink('position')} className={`flex items-center gap-1 hover:text-zinc-300 ${sortBy === 'position' ? 'text-indigo-400' : ''}`}>
                        Pos. <ArrowUpDown className="h-3 w-3" />
                      </Link>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {sorted.map((row, i) => (
                    <tr key={row.id} className="group table-row-hover">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-600 w-5 text-right shrink-0">{i + 1}</span>
                          <div className="min-w-0">
                            <Link
                              href={`/blog/${row.id}/editar`}
                              className="block text-xs font-medium text-zinc-100 line-clamp-1 hover:text-indigo-300 transition-colors"
                            >
                              {row.title}
                            </Link>
                            <a
                              href={`${SITE_URL}/blog/${row.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors mt-0.5"
                            >
                              /{row.slug}
                              <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100" />
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span className={`text-xs font-semibold tabular-nums ${row.clicks > 0 ? 'text-zinc-100' : 'text-zinc-600'}`}>
                            {row.clicks > 0 ? row.clicks.toLocaleString('pt-BR') : '—'}
                          </span>
                          {row.clicks > 0 && <MiniBar value={row.clicks} max={maxClicks} color="bg-indigo-500" />}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span className={`text-xs tabular-nums ${row.impressions > 0 ? 'text-zinc-300' : 'text-zinc-600'}`}>
                            {row.impressions > 0 ? row.impressions.toLocaleString('pt-BR') : '—'}
                          </span>
                          {row.impressions > 0 && <MiniBar value={row.impressions} max={maxImpressions} color="bg-sky-500" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs tabular-nums text-zinc-400">
                        {row.impressions > 0 ? `${(row.ctr * 100).toFixed(2)}%` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <PosBadge pos={row.position} />
                      </td>
                    </tr>
                  ))}
                  {sorted.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-zinc-500 text-sm">
                        Nenhum artigo publicado com dados do GSC ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Top Queries (1/3) ── */}
        <div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm overflow-hidden">
            <div className="border-b border-zinc-800 px-5 py-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-zinc-400" />
              <h2 className="text-sm font-semibold text-zinc-200">Top Queries ({validPeriod}d)</h2>
            </div>
            <ul className="divide-y divide-zinc-800/60">
              {topQueries.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-zinc-500">
                  Sem dados de queries ainda.
                </li>
              )}
              {topQueries.map((q, i) => (
                <li key={q.query} className="px-4 py-3 hover:bg-zinc-800/30 transition-colors">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-zinc-500 bg-zinc-800 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-xs font-medium text-zinc-200 leading-relaxed">{q.query}</p>
                  </div>
                  <div className="ml-7 grid grid-cols-3 gap-2 text-[10px] text-zinc-500">
                    <span><span className="text-zinc-300 font-medium">{q.clicks}</span> cliques</span>
                    <span><span className="text-zinc-300 font-medium">{q.impressions.toLocaleString('pt-BR')}</span> imp.</span>
                    <span>pos. <span className={`font-medium ${q.position <= 3 ? 'text-emerald-400' : q.position <= 10 ? 'text-sky-400' : 'text-zinc-400'}`}>{q.position.toFixed(0)}</span></span>
                  </div>
                  <div className="ml-7 mt-1.5 progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.min((q.clicks / (topQueries[0]?.clicks || 1)) * 100, 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
