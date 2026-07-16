import Link from 'next/link'
import {
  Globe2, MousePointerClick, Eye, Target, BarChart3,
  TrendingUp, TrendingDown, Minus, Smartphone, Monitor,
  Tablet, MapPin, Zap, ExternalLink, Search, ArrowUpDown,
} from 'lucide-react'
import { getSiteDashboard } from '@/lib/google-search-console'
import { requireAdminSession } from '@/lib/auth'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Site — Freela Dock Admin',
}

// Revalida a cada 30 min — dados do GSC são pesados
export const revalidate = 1800

const PERIODS = [
  { label: '7 dias',  days: 7  },
  { label: '28 dias', days: 28 },
  { label: '90 dias', days: 90 },
] as const

// Mapa de nomes de países (ISO alpha-3 → nome PT-BR)
const COUNTRY_NAMES: Record<string, string> = {
  bra: 'Brasil', usa: 'EUA', prt: 'Portugal', arg: 'Argentina',
  col: 'Colômbia', mex: 'México', esp: 'Espanha', gbr: 'Reino Unido',
  fra: 'França', deu: 'Alemanha', ita: 'Itália', can: 'Canadá',
  aus: 'Austrália', jpn: 'Japão', chl: 'Chile', per: 'Peru',
  ury: 'Uruguai', ven: 'Venezuela', bol: 'Bolívia', ecu: 'Equador',
  pry: 'Paraguai', nic: 'Nicarágua', gtm: 'Guatemala',
}

// Flags emoji por código ISO alpha-3
const COUNTRY_FLAG: Record<string, string> = {
  bra: '🇧🇷', usa: '🇺🇸', prt: '🇵🇹', arg: '🇦🇷', col: '🇨🇴',
  mex: '🇲🇽', esp: '🇪🇸', gbr: '🇬🇧', fra: '🇫🇷', deu: '🇩🇪',
  ita: '🇮🇹', can: '🇨🇦', aus: '🇦🇺', jpn: '🇯🇵', chl: '🇨🇱',
  per: '🇵🇪', ury: '🇺🇾', ven: '🇻🇪', bol: '🇧🇴', ecu: '🇪🇨',
  pry: '🇵🇾', nic: '🇳🇮', gtm: '🇬🇹',
}

const DEVICE_LABEL: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  MOBILE:  { label: 'Mobile',  icon: Smartphone, color: 'text-indigo-400' },
  DESKTOP: { label: 'Desktop', icon: Monitor,    color: 'text-sky-400'    },
  TABLET:  { label: 'Tablet',  icon: Tablet,     color: 'text-amber-400'  },
}

/** Variação percentual entre atual e anterior com seta */
function DeltaBadge({ current, previous, invert = false }: { current: number; previous: number; invert?: boolean }) {
  if (previous === 0) return <span className="text-zinc-600 text-xs">—</span>
  const pct = ((current - previous) / previous) * 100
  const up = invert ? pct < 0 : pct > 0 // Posição: menor = melhor
  const neutral = Math.abs(pct) < 1

  if (neutral) return (
    <span className="inline-flex items-center gap-0.5 text-xs text-zinc-500">
      <Minus className="h-3 w-3" /> 0%
    </span>
  )

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

/** Badge de posição colorido */
function PosBadge({ pos }: { pos: number }) {
  if (pos === 0) return <span className="text-zinc-600 text-xs">—</span>
  if (pos <= 3)  return <span className="gsc-badge-excellent">#{pos.toFixed(1)}</span>
  if (pos <= 10) return <span className="gsc-badge-good">#{pos.toFixed(1)}</span>
  if (pos <= 20) return <span className="gsc-badge-fair">#{pos.toFixed(1)}</span>
  return <span className="text-xs text-zinc-500">#{pos.toFixed(0)}</span>
}

/** Sparkline SVG inline — sem dependências externas */
function Sparkline({
  data,
  field,
  color = 'rgb(99 102 241)',
  gradientId,
}: {
  data: { date: string; clicks: number; impressions: number; ctr: number; position: number }[]
  field: 'clicks' | 'impressions'
  color?: string
  gradientId: string
}) {
  if (data.length < 2) return null
  const values = data.map(d => d[field])
  const max = Math.max(...values, 1)
  const min = Math.min(...values)
  const range = max - min || 1

  const W = 200, H = 40
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W
    const y = H - ((v - min) / range) * (H - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  const lastVal = values[values.length - 1]
  const prevVal = values[values.length - 2]
  const trend = lastVal > prevVal ? '↑' : lastVal < prevVal ? '↓' : '→'
  const trendColor = lastVal > prevVal ? 'text-emerald-400' : lastVal < prevVal ? 'text-rose-400' : 'text-zinc-500'

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-10 overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <polygon points={`0,${H} ${points} ${W},${H}`} fill={`url(#${gradientId})`} />
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        {/* Último ponto */}
        {(() => {
          const lastPts = points.split(' ').pop()?.split(',') ?? []
          if (lastPts.length < 2) return null
          return <circle cx={lastPts[0]} cy={lastPts[1]} r="2.5" fill={color} />
        })()}
      </svg>
      <span className={`absolute top-0 right-0 text-xs font-bold ${trendColor}`}>{trend}</span>
    </div>
  )
}

export default async function SitePage(props: {
  searchParams: Promise<{ period?: string; sort?: string }>
}) {
  await requireAdminSession()
  const searchParams = await props.searchParams
  const days = Number(searchParams?.period || '28')
  const validDays = [7, 28, 90].includes(days) ? days : 28
  const sortPages = (searchParams?.sort || 'clicks') as 'clicks' | 'impressions' | 'ctr' | 'position'

  const data = await getSiteDashboard(validDays)

  // Ordena páginas
  const sortedPages = data
    ? [...data.topPages].sort((a, b) =>
        sortPages === 'position'
          ? (a.position || 999) - (b.position || 999)
          : (b[sortPages] || 0) - (a[sortPages] || 0)
      )
    : []

  const maxPageClicks = Math.max(...(sortedPages.map(p => p.clicks) ?? [1]), 1)
  const totalDeviceClicks = data?.devices.reduce((s, d) => s + d.clicks, 0) || 1
  const totalCountryClicks = data?.countries.reduce((s, c) => s + c.clicks, 0) || 1

  function sortLink(field: string) {
    return `/site?period=${validDays}&sort=${field}`
  }

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://freeladock.com.br'

  if (!data) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-96">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800 mb-4">
          <Globe2 className="h-8 w-8 text-zinc-500" />
        </div>
        <h1 className="text-xl font-bold text-zinc-300">Dados indisponíveis</h1>
        <p className="mt-2 text-sm text-zinc-500 text-center max-w-sm">
          Não foi possível carregar os dados do Google Search Console. Verifique as credenciais no <code className="text-zinc-400">.env.local</code>.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 animate-fade-in">

      {/* ── Cabeçalho ── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15">
              <Globe2 className="h-4 w-4 text-sky-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">Site — freeladock.com.br</h1>
            </div>
          </div>
          <p className="text-sm text-zinc-400 ml-12">
            Google Search Console · Tráfego orgânico
            <a
              href={SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors"
            >
              Abrir site <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>

        {/* Seletor de período */}
        <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1 self-start sm:self-auto">
          {PERIODS.map(({ label, days: d }) => (
            <Link
              key={d}
              href={`/site?period=${d}&sort=${sortPages}`}
              className={[
                'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                validDays === d ? 'bg-sky-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200',
              ].join(' ')}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── KPI Cards — 4 principais com delta ── */}
      <div className="mb-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Cliques',
            value: data.current.clicks.toLocaleString('pt-BR'),
            prev: data.previous.clicks,
            cur: data.current.clicks,
            icon: MousePointerClick,
            accent: 'text-indigo-400',
            border: 'border-indigo-500/20',
            bg: 'bg-indigo-500/10',
            invert: false,
            sub: 'Visitas orgânicas',
          },
          {
            label: 'Impressões',
            value: data.current.impressions.toLocaleString('pt-BR'),
            prev: data.previous.impressions,
            cur: data.current.impressions,
            icon: Eye,
            accent: 'text-sky-400',
            border: 'border-sky-500/20',
            bg: 'bg-sky-500/10',
            invert: false,
            sub: 'Exibições no Google',
          },
          {
            label: 'CTR Médio',
            value: `${(data.current.ctr * 100).toFixed(2)}%`,
            prev: data.previous.ctr,
            cur: data.current.ctr,
            icon: Target,
            accent: 'text-emerald-400',
            border: 'border-emerald-500/20',
            bg: 'bg-emerald-500/10',
            invert: false,
            sub: 'Taxa de cliques',
          },
          {
            label: 'Posição Média',
            value: data.current.position.toFixed(1),
            prev: data.previous.position,
            cur: data.current.position,
            icon: BarChart3,
            accent: 'text-amber-400',
            border: 'border-amber-500/20',
            bg: 'bg-amber-500/10',
            invert: true, // Menor posição = melhor
            sub: 'Ranking Google',
          },
        ].map(({ label, value, prev, cur, icon: Icon, accent, border, bg, invert, sub }) => (
          <div key={label} className={`metric-card rounded-xl border ${border} bg-zinc-900/80 p-5 backdrop-blur-sm`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}>
                <Icon className={`h-4 w-4 ${accent}`} />
              </span>
            </div>
            <p className={`text-2xl font-bold ${accent}`}>{value}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <DeltaBadge current={cur} previous={prev} invert={invert} />
              <span className="text-xs text-zinc-600">vs período anterior</span>
            </div>
            <p className="mt-1 text-[10px] text-zinc-600">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Gráfico de Tendência Diária ── */}
      {data.daily.length > 1 && (
        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-zinc-200">Tendência de Tráfego</h2>
              <p className="text-xs text-zinc-500 mt-0.5">{data.daily.length} dias de dados diários</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded-full bg-indigo-500 inline-block" /> Cliques
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded-full bg-sky-500 inline-block" /> Impressões
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-zinc-500 mb-2">Cliques diários</p>
              <Sparkline data={data.daily} field="clicks" color="rgb(99 102 241)" gradientId="grad-clicks" />
              <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                <span>{data.daily[0]?.date?.slice(5)}</span>
                <span className="font-medium text-indigo-400">
                  {data.daily[data.daily.length - 1]?.clicks?.toLocaleString('pt-BR')} hoje
                </span>
                <span>{data.daily[data.daily.length - 1]?.date?.slice(5)}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-2">Impressões diárias</p>
              <Sparkline data={data.daily} field="impressions" color="rgb(14 165 233)" gradientId="grad-impr" />
              <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                <span>{data.daily[0]?.date?.slice(5)}</span>
                <span className="font-medium text-sky-400">
                  {data.daily[data.daily.length - 1]?.impressions?.toLocaleString('pt-BR')} hoje
                </span>
                <span>{data.daily[data.daily.length - 1]?.date?.slice(5)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Grid: Dispositivos + Países ── */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">

        {/* Dispositivos */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 backdrop-blur-sm">
          <h2 className="text-sm font-semibold text-zinc-200 mb-4">Por Dispositivo</h2>
          <div className="space-y-4">
            {data.devices
              .sort((a, b) => b.clicks - a.clicks)
              .map(device => {
                const info = DEVICE_LABEL[device.device] ?? { label: device.device, icon: Monitor, color: 'text-zinc-400' }
                const DevIcon = info.icon
                const pct = totalDeviceClicks > 0 ? (device.clicks / totalDeviceClicks) * 100 : 0
                return (
                  <div key={device.device}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <DevIcon className={`h-4 w-4 ${info.color}`} />
                        <span className="text-sm text-zinc-300 font-medium">{info.label}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-zinc-400 tabular-nums">{device.clicks.toLocaleString('pt-BR')} cliques</span>
                        <span className={`font-bold ${info.color}`}>{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="progress-track">
                      <div
                        className={`progress-fill ${device.device === 'MOBILE' ? 'bg-indigo-500' : device.device === 'DESKTOP' ? 'bg-sky-500' : 'bg-amber-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-[10px] text-zinc-600">
                      <span>{device.impressions.toLocaleString('pt-BR')} imp.</span>
                      <span>CTR {(device.ctr * 100).toFixed(1)}%</span>
                      <span>Pos. {device.position.toFixed(1)}</span>
                    </div>
                  </div>
                )
              })}
            {data.devices.length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-4">Sem dados de dispositivos</p>
            )}
          </div>
        </div>

        {/* Países */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 backdrop-blur-sm">
          <h2 className="text-sm font-semibold text-zinc-200 mb-4">Por País</h2>
          <div className="space-y-3">
            {data.countries
              .sort((a, b) => b.clicks - a.clicks)
              .map((c, i) => {
                const name = COUNTRY_NAMES[c.country] ?? c.country.toUpperCase()
                const flag = COUNTRY_FLAG[c.country] ?? '🌐'
                const pct = totalCountryClicks > 0 ? (c.clicks / totalCountryClicks) * 100 : 0
                return (
                  <div key={c.country} className="flex items-center gap-3">
                    <span className="text-xs text-zinc-600 w-4 text-right shrink-0">{i + 1}</span>
                    <span className="text-base shrink-0">{flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-zinc-300">{name}</span>
                        <span className="text-xs text-zinc-500 tabular-nums">{c.clicks.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill bg-sky-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-zinc-500 shrink-0 w-10 text-right">{pct.toFixed(0)}%</span>
                  </div>
                )
              })}
            {data.countries.length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-4">Sem dados de países</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Grid: Top Páginas + Queries ── */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">

        {/* Top Páginas (2/3) */}
        <div className="lg:col-span-2 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
          <div className="border-b border-zinc-800 px-5 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-200">Top Páginas</h2>
              <p className="text-xs text-zinc-500 mt-0.5">{sortedPages.length} páginas com tráfego orgânico</p>
            </div>
            <span className="text-xs text-zinc-600">Ordenar por:</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3 font-medium">URL</th>
                  <th className="px-4 py-3 font-medium">
                    <Link href={sortLink('clicks')} className={`flex items-center gap-1 hover:text-zinc-300 transition-colors ${sortPages === 'clicks' ? 'text-indigo-400' : ''}`}>
                      Cliques <ArrowUpDown className="h-3 w-3" />
                    </Link>
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <Link href={sortLink('impressions')} className={`flex items-center gap-1 hover:text-zinc-300 transition-colors ${sortPages === 'impressions' ? 'text-indigo-400' : ''}`}>
                      Imp. <ArrowUpDown className="h-3 w-3" />
                    </Link>
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <Link href={sortLink('ctr')} className={`flex items-center gap-1 hover:text-zinc-300 transition-colors ${sortPages === 'ctr' ? 'text-indigo-400' : ''}`}>
                      CTR <ArrowUpDown className="h-3 w-3" />
                    </Link>
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <Link href={sortLink('position')} className={`flex items-center gap-1 hover:text-zinc-300 transition-colors ${sortPages === 'position' ? 'text-indigo-400' : ''}`}>
                      Pos. <ArrowUpDown className="h-3 w-3" />
                    </Link>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {sortedPages.map((page, i) => {
                  // Extrai caminho relativo da URL
                  const path = page.url.replace(/^https?:\/\/[^/]+/, '') || '/'
                  const pct = maxPageClicks > 0 ? (page.clicks / maxPageClicks) * 100 : 0
                  return (
                    <tr key={page.url} className="group table-row-hover">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-600 w-5 text-right shrink-0">{i + 1}</span>
                          <div className="min-w-0">
                            <a
                              href={page.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs font-medium text-zinc-200 hover:text-sky-300 transition-colors truncate max-w-[200px]"
                              title={path}
                            >
                              <span className="truncate">{path}</span>
                              <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-0 group-hover:opacity-100" />
                            </a>
                            <div className="h-1 w-full rounded-full bg-zinc-800 mt-1 overflow-hidden">
                              <div className="h-full rounded-full bg-indigo-500/60" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-zinc-100 tabular-nums">
                        {page.clicks > 0 ? page.clicks.toLocaleString('pt-BR') : <span className="text-zinc-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400 tabular-nums">
                        {page.impressions > 0 ? page.impressions.toLocaleString('pt-BR') : <span className="text-zinc-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400 tabular-nums">
                        {page.impressions > 0 ? `${(page.ctr * 100).toFixed(1)}%` : <span className="text-zinc-600">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <PosBadge pos={page.position} />
                      </td>
                    </tr>
                  )
                })}
                {sortedPages.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-zinc-500">
                      Nenhuma página com dados GSC ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Queries (1/3) */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm overflow-hidden">
            <div className="border-b border-zinc-800 px-4 py-3 flex items-center gap-2">
              <Search className="h-4 w-4 text-zinc-400" />
              <h2 className="text-sm font-semibold text-zinc-200">Top Queries</h2>
            </div>
            <ul className="divide-y divide-zinc-800/60">
              {data.topQueries.slice(0, 10).map((q, i) => (
                <li key={q.query} className="px-4 py-2.5 hover:bg-zinc-800/30 transition-colors">
                  <div className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-zinc-600 bg-zinc-800 mt-0.5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-200 truncate" title={q.query}>{q.query}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-500">
                        <span className="text-zinc-300">{q.clicks}</span> cliques ·
                        <PosBadge pos={q.position} />
                      </div>
                    </div>
                  </div>
                </li>
              ))}
              {data.topQueries.length === 0 && (
                <li className="px-4 py-8 text-center text-xs text-zinc-500">Sem queries ainda.</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Striking Distance — Oportunidades de Ouro ── */}
      {data.strikingDistance.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15">
              <Zap className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-200">Oportunidades de Ouro — Striking Distance</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Queries na posição 5–20 com alto volume de impressões. Um pequeno empurrão pode trazer muito tráfego.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800/60 text-left text-xs uppercase tracking-wider text-zinc-500">
                  <th className="pb-2 pr-4 font-medium">Query</th>
                  <th className="pb-2 pr-4 font-medium text-center">Posição</th>
                  <th className="pb-2 pr-4 font-medium text-center">Impressões</th>
                  <th className="pb-2 pr-4 font-medium text-center">Cliques</th>
                  <th className="pb-2 font-medium text-center">CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/30">
                {data.strikingDistance.map((q, i) => (
                  <tr key={q.query} className="group">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-600 w-4">{i + 1}</span>
                        <span className="text-xs font-medium text-zinc-200">{q.query}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-center">
                      <span className="gsc-badge-fair">#{q.position.toFixed(1)}</span>
                    </td>
                    <td className="py-2.5 pr-4 text-center text-xs text-zinc-300 tabular-nums font-semibold">
                      {q.impressions.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2.5 pr-4 text-center text-xs text-zinc-400 tabular-nums">
                      {q.clicks}
                    </td>
                    <td className="py-2.5 text-center text-xs text-zinc-400 tabular-nums">
                      {(q.ctr * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-lg bg-amber-500/8 border border-amber-500/15 px-4 py-3">
            <p className="text-xs text-amber-300/80">
              💡 <strong>Dica:</strong> Otimize o título e meta description das páginas rankeando para essas queries.
              Adicione conteúdo mais aprofundado e links internos das páginas com mais autoridade.
            </p>
          </div>
        </div>
      )}

    </div>
  )
}
