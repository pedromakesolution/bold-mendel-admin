import Link from 'next/link'
import {
  Plus, Pencil, Archive, Globe, ExternalLink, Search,
  BarChart3, MousePointerClick, Eye, Target, TrendingUp,
  TrendingDown, Minus, ArrowUpRight, FileText, Zap,
} from 'lucide-react'
import { createBlogAdminClient, type Post } from '@/lib/blog-admin-client'
import { publishPost, archivePost, deletePost } from '@/app/actions/blog'
import { getDailyIndexingCount } from '@/app/actions/indexing'
import { DeletePostButton } from './DeletePostButton'
import { PostTableRow } from './PostTableRow'
import { BlogTableClient, type PostWithMetrics } from './BlogTableClient'
import { getSiteMetrics, getAllPostsMetrics, getTopQueries } from '@/lib/google-search-console'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Blog — Freela Dock Admin' }

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://freeladock.com.br'

export const revalidate = 60

const STATUS_BADGE: Record<Post['status'], { label: string; className: string }> = {
  draft:     { label: 'Rascunho',  className: 'badge-slate'   },
  published: { label: 'Publicado', className: 'badge-emerald' },
  archived:  { label: 'Arquivado', className: 'badge-amber'   },
}

/** Classifica performance de cliques num badge */
function PerformanceBadge({ clicks, impressions }: { clicks: number; impressions: number }) {
  if (impressions === 0) return <span className="text-zinc-600 text-xs">—</span>
  if (clicks >= 50)  return <span className="gsc-badge-excellent">{clicks.toLocaleString('pt-BR')}</span>
  if (clicks >= 10)  return <span className="gsc-badge-good">{clicks.toLocaleString('pt-BR')}</span>
  if (clicks > 0)    return <span className="gsc-badge-fair">{clicks.toLocaleString('pt-BR')}</span>
  return <span className="text-zinc-600 text-xs">0</span>
}

/** Posição média com colorização */
function PositionCell({ pos }: { pos: number }) {
  if (pos === 0) return <span className="text-zinc-600 text-xs">—</span>
  const color = pos <= 3 ? 'text-emerald-400' : pos <= 10 ? 'text-sky-400' : pos <= 20 ? 'text-amber-400' : 'text-zinc-500'
  return <span className={`text-xs font-semibold tabular-nums ${color}`}>{pos.toFixed(1)}</span>
}

export default async function BlogListPage(props: { searchParams: Promise<{ q?: string }> }) {
  const searchParams = await props.searchParams
  const q = searchParams?.q || ''

  const supabase = createBlogAdminClient()
  let query = supabase
    .from('posts')
    .select('id, slug, title, status, published_at, created_at, google_index_status, google_index_checked_at, google_index_requested_at')
    .order('created_at', { ascending: false })

  if (q) {
    query = query.or(`title.ilike.%${q}%,slug.ilike.%${q}%,excerpt.ilike.%${q}%,content_md.ilike.%${q}%`)
  }

  // Busca dados em paralelo: posts + métricas site + métricas por artigo + top queries + cota diária
  const [postsRes, metrics, allPostsMetrics, topQueries, dailyIndexingCount] = await Promise.all([
    query,
    getSiteMetrics(),
    getAllPostsMetrics(),
    getTopQueries(undefined, undefined, 10),
    getDailyIndexingCount(),
  ])

  if (postsRes.error) {
    console.error('Erro ao buscar posts no Supabase:', postsRes.error.message)
  }

  const posts = postsRes.data
  const totalPosts = posts?.length ?? 0
  const publishedPosts = posts?.filter(p => p.status === 'published').length ?? 0

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      {/* ── Cabeçalho ── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15">
              <FileText className="h-4 w-4 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-100">Blog</h1>
          </div>
          <p className="text-sm text-zinc-400 ml-12">
            <span className="text-zinc-100 font-medium">{totalPosts}</span> posts no total ·{' '}
            <span className="text-emerald-400 font-medium">{publishedPosts}</span> publicados
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Link para análise SEO completa */}
          <Link
            href="/blog/seo"
            className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:border-indigo-500/50 hover:text-indigo-300"
          >
            <BarChart3 className="h-4 w-4" />
            SEO Analytics
            <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
          </Link>

          {/* Busca */}
          <form method="GET" action="/blog" className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Buscar artigos..."
              className="w-64 rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </form>

          <Link
            href="/blog/novo"
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Novo Post
          </Link>
        </div>
      </div>

      {/* ── KPI Cards GSC & Quota ── */}
      <div className="mb-8 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {metrics && [
          {
            label: 'Cliques (28d)',
            value: metrics.clicks.toLocaleString('pt-BR'),
            icon: MousePointerClick,
            accent: 'text-indigo-400',
            bg: 'bg-indigo-500/10',
            border: 'border-indigo-500/20',
          },
          {
            label: 'Impressões (28d)',
            value: metrics.impressions.toLocaleString('pt-BR'),
            icon: Eye,
            accent: 'text-sky-400',
            bg: 'bg-sky-500/10',
            border: 'border-sky-500/20',
          },
          {
            label: 'CTR Médio',
            value: `${(metrics.ctr * 100).toFixed(2)}%`,
            icon: Target,
            accent: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
          },
          {
            label: 'Posição Média',
            value: metrics.position.toFixed(1),
            icon: BarChart3,
            accent: 'text-amber-400',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
          },
        ].map(({ label, value, icon: Icon, accent, bg, border }) => (
          <div key={label} className={`metric-card rounded-xl border ${border} bg-zinc-900/80 p-5 backdrop-blur-sm`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}>
                <Icon className={`h-4 w-4 ${accent}`} />
              </span>
            </div>
            <p className={`text-2xl font-bold ${accent}`}>{value}</p>
            <p className="mt-1 text-xs text-zinc-600">Google Search Console</p>
          </div>
        ))}

        {/* Quota Card */}
        {(() => {
          const quotaPct = Math.min((dailyIndexingCount / 200) * 100, 100);
          const quotaColor = 
            dailyIndexingCount >= 180 
              ? { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', progress: 'bg-rose-500' }
              : dailyIndexingCount >= 120
              ? { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', progress: 'bg-amber-500' }
              : { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', progress: 'bg-violet-500' };

          return (
            <div className={`metric-card rounded-xl border ${quotaColor.border} bg-zinc-900/80 p-5 backdrop-blur-sm flex flex-col justify-between`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Cota Index (Hoje)</p>
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${quotaColor.bg}`}>
                    <Zap className={`h-4 w-4 ${quotaColor.text} fill-current`} />
                  </span>
                </div>
                <p className={`text-2xl font-bold ${quotaColor.text}`}>{dailyIndexingCount} <span className="text-sm text-zinc-500 font-normal">/ 200</span></p>
              </div>
              <div className="mt-4">
                <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div className={`h-full ${quotaColor.progress} transition-all duration-500`} style={{ width: `${quotaPct}%` }} />
                </div>
                <p className="mt-1 text-[10px] text-zinc-500">Google Indexing API</p>
              </div>
            </div>
          )
        })()}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Tabela de Posts (2/3) ── */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
            <div className="border-b border-zinc-800 px-5 py-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-200">Artigos</h2>
              {allPostsMetrics.size > 0 && (
                <span className="text-xs text-zinc-500">+ métricas GSC (28d)</span>
              )}
            </div>

            {!posts?.length ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <FileText className="h-6 w-6 text-zinc-500" />
                </div>
                <p className="text-zinc-400">Nenhum post criado ainda.</p>
                <Link href="/blog/novo" className="mt-3 text-sm text-indigo-400 hover:underline">
                  Criar primeiro post →
                </Link>
              </div>
            ) : (
              <BlogTableClient 
                posts={posts.map(p => ({
                  ...p,
                  gsc: allPostsMetrics.get(p.slug)
                })) as PostWithMetrics[]} 
                hasMetrics={allPostsMetrics.size > 0} 
              />
            )}
          </div>
        </div>

        {/* ── Sidebar: Top Queries (1/3) ── */}
        <div className="flex flex-col gap-6">
          {/* Top Queries */}
          {topQueries.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm overflow-hidden">
              <div className="border-b border-zinc-800 px-5 py-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-200">Top Queries (28d)</h2>
                <Link href="/blog/seo" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Ver todas →
                </Link>
              </div>
              <ul className="divide-y divide-zinc-800/60">
                {topQueries.map((q, i) => (
                  <li key={q.query} className="flex items-center gap-3 px-4 py-3 group hover:bg-zinc-800/30 transition-colors">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-zinc-500 bg-zinc-800">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-200 truncate">{q.query}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-zinc-500">
                          {q.clicks} cliques · pos. {q.position.toFixed(0)}
                        </span>
                      </div>
                    </div>
                    <div className="progress-track w-16">
                      <div
                        className="progress-fill"
                        style={{ width: `${Math.min((q.clicks / (topQueries[0]?.clicks || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <div className="px-4 py-3 border-t border-zinc-800">
                <Link
                  href="/blog/seo"
                  className="flex items-center justify-center gap-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  Analytics completo
                </Link>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 backdrop-blur-sm">
            <h2 className="text-sm font-semibold text-zinc-200 mb-4">Resumo</h2>
            <div className="space-y-3">
              {[
                { label: 'Publicados', value: posts?.filter(p => p.status === 'published').length ?? 0, color: 'bg-emerald-500' },
                { label: 'Rascunhos', value: posts?.filter(p => p.status === 'draft').length ?? 0, color: 'bg-zinc-600' },
                { label: 'Arquivados', value: posts?.filter(p => p.status === 'archived').length ?? 0, color: 'bg-amber-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${color} shrink-0`} />
                  <span className="flex-1 text-sm text-zinc-400">{label}</span>
                  <span className="text-sm font-semibold text-zinc-100">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
