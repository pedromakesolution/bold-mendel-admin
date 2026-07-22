'use client'

import { useState, useMemo, useEffect } from 'react'
import { PostTableRow } from './PostTableRow'
import { PostGridCard } from './PostGridCard'
import { submitBatchToIndex, checkBatchIndexStatus } from '@/app/actions/indexing'
import {
  SearchCheck, Globe, Loader2, CheckSquare, Search, X,
  RotateCcw, LayoutGrid, LayoutList, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, ArrowUpDown, Calendar, Filter, FileText
} from 'lucide-react'
import type { Post } from '@/lib/blog-admin-client'
import type { SearchConsoleMetrics } from '@/lib/google-search-console'

export type PostWithMetrics = Post & { gsc?: SearchConsoleMetrics }

type StatusFilterType = 'all' | 'published' | 'draft' | 'archived' | 'attention'
type IndexFilterType = 'all' | 'PASS' | 'NEUTRAL' | 'FAIL' | 'PARTIAL' | 'UNCHECKED' | 'REQUESTED'
type DateFilterType = 'all' | '7d' | '30d' | 'this_month' | 'this_year'
type SortByType = 'created_desc' | 'created_asc' | 'title_asc' | 'title_desc' | 'clicks_desc' | 'impressions_desc' | 'position_asc'
type ViewModeType = 'table' | 'grid'

export function BlogTableClient({ posts, hasMetrics }: { posts: PostWithMetrics[]; hasMetrics: boolean }) {
  // State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all')
  const [indexFilter, setIndexFilter] = useState<IndexFilterType>('all')
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all')
  const [sortBy, setSortBy] = useState<SortByType>('created_desc')

  // Pagination & Layout State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(25)
  const [viewMode, setViewMode] = useState<ViewModeType>('table')

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, indexFilter, dateFilter, sortBy, pageSize])

  // Counts for status tabs
  const counts = useMemo(() => {
    const total = posts.length
    const published = posts.filter(p => p.status === 'published').length
    const draft = posts.filter(p => p.status === 'draft').length
    const archived = posts.filter(p => p.status === 'archived').length
    const attention = posts.filter(p => p.google_index_status === 'FAIL' || p.google_index_status === 'NEUTRAL' || !p.google_index_status).length
    return { total, published, draft, archived, attention }
  }, [posts])

  // Filtering & Sorting pipeline
  const filteredAndSortedPosts = useMemo(() => {
    return posts
      .filter((post) => {
        // 1. Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim()
          const matchesTitle = post.title.toLowerCase().includes(q)
          const matchesSlug = post.slug.toLowerCase().includes(q)
          const matchesExcerpt = post.excerpt ? post.excerpt.toLowerCase().includes(q) : false
          if (!matchesTitle && !matchesSlug && !matchesExcerpt) return false
        }

        // 2. Post Status Filter
        if (statusFilter === 'published' && post.status !== 'published') return false
        if (statusFilter === 'draft' && post.status !== 'draft') return false
        if (statusFilter === 'archived' && post.status !== 'archived') return false
        if (statusFilter === 'attention') {
          // Requer Atenção = Erro ou Não Indexado
          if (post.google_index_status !== 'FAIL' && post.google_index_status !== 'NEUTRAL' && post.google_index_status !== null) return false
        }

        // 3. Google Index Status Filter
        if (indexFilter === 'PASS' && post.google_index_status !== 'PASS') return false
        if (indexFilter === 'NEUTRAL' && post.google_index_status !== 'NEUTRAL') return false
        if (indexFilter === 'FAIL' && post.google_index_status !== 'FAIL') return false
        if (indexFilter === 'PARTIAL' && post.google_index_status !== 'PARTIAL') return false
        if (indexFilter === 'UNCHECKED' && post.google_index_status !== null) return false
        if (indexFilter === 'REQUESTED' && !post.google_index_requested_at) return false

        // 4. Date Filter
        if (dateFilter !== 'all' && post.created_at) {
          const created = new Date(post.created_at).getTime()
          const now = Date.now()
          const oneDay = 24 * 60 * 60 * 1000

          if (dateFilter === '7d' && now - created > 7 * oneDay) return false
          if (dateFilter === '30d' && now - created > 30 * oneDay) return false
          if (dateFilter === 'this_month') {
            const date = new Date(post.created_at)
            const today = new Date()
            if (date.getMonth() !== today.getMonth() || date.getFullYear() !== today.getFullYear()) return false
          }
          if (dateFilter === 'this_year') {
            const date = new Date(post.created_at)
            const today = new Date()
            if (date.getFullYear() !== today.getFullYear()) return false
          }
        }

        return true
      })
      .sort((a, b) => {
        // 5. Sorting logic
        if (sortBy === 'created_desc') {
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        }
        if (sortBy === 'created_asc') {
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
        }
        if (sortBy === 'title_asc') {
          return a.title.localeCompare(b.title, 'pt-BR')
        }
        if (sortBy === 'title_desc') {
          return b.title.localeCompare(a.title, 'pt-BR')
        }
        if (sortBy === 'clicks_desc') {
          return (b.gsc?.clicks ?? 0) - (a.gsc?.clicks ?? 0)
        }
        if (sortBy === 'impressions_desc') {
          return (b.gsc?.impressions ?? 0) - (a.gsc?.impressions ?? 0)
        }
        if (sortBy === 'position_asc') {
          const posA = a.gsc?.position && a.gsc.position > 0 ? a.gsc.position : 999
          const posB = b.gsc?.position && b.gsc.position > 0 ? b.gsc.position : 999
          return posA - posB
        }
        return 0
      })
  }, [posts, searchQuery, statusFilter, indexFilter, dateFilter, sortBy])

  // Pagination calculation
  const totalItems = filteredAndSortedPosts.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const paginatedPosts = useMemo(() => {
    return filteredAndSortedPosts.slice(startIndex, endIndex)
  }, [filteredAndSortedPosts, startIndex, endIndex])

  const isFilterActive = searchQuery !== '' || statusFilter !== 'all' || indexFilter !== 'all' || dateFilter !== 'all' || sortBy !== 'created_desc'

  const resetFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setIndexFilter('all')
    setDateFilter('all')
    setSortBy('created_desc')
  }

  // Selection handlers
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const toggleSelectPage = () => {
    const pageIds = paginatedPosts.map(p => p.id)
    const allPageSelected = pageIds.every(id => selectedIds.has(id))
    const next = new Set(selectedIds)

    if (allPageSelected) {
      pageIds.forEach(id => next.delete(id))
    } else {
      pageIds.forEach(id => next.add(id))
    }
    setSelectedIds(next)
  }

  const toggleSelectAllFiltered = () => {
    if (selectedIds.size === filteredAndSortedPosts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredAndSortedPosts.map(p => p.id)))
    }
  }

  // Batch action handlers
  const handleBatchInspect = async () => {
    if (selectedIds.size === 0) return
    setIsProcessing(true)
    const items = posts.filter(p => selectedIds.has(p.id)).map(p => ({ id: p.id, slug: p.slug }))
    try {
      const res = await checkBatchIndexStatus(items)
      if (res.error) alert(res.error)
      else {
        alert('Status verificados com sucesso.')
        setSelectedIds(new Set())
      }
    } catch (e: any) {
      alert('Erro inesperado: ' + e.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBatchIndex = async () => {
    if (selectedIds.size === 0) return
    setIsProcessing(true)
    const slugs = posts.filter(p => selectedIds.has(p.id)).map(p => p.slug)
    try {
      const res = await submitBatchToIndex(slugs, 'URL_UPDATED')
      if (res.error) alert(res.error)
      else {
        alert(`Sucesso! ${res.count}/${res.total} solicitações foram enviadas para o Google.`)
        setSelectedIds(new Set())
      }
    } catch (e: any) {
      alert('Erro inesperado: ' + e.message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* ── Status Tab Navigation Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3 px-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'Todos', count: counts.total },
            { id: 'published', label: 'Publicados', count: counts.published, color: 'text-emerald-400' },
            { id: 'draft', label: 'Rascunhos', count: counts.draft, color: 'text-zinc-400' },
            { id: 'archived', label: 'Arquivados', count: counts.archived, color: 'text-amber-400' },
            { id: 'attention', label: 'Requer Atenção', count: counts.attention, color: 'text-rose-400' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as StatusFilterType)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                statusFilter === tab.id ? 'bg-indigo-700/80 text-white' : 'bg-zinc-950/60 text-zinc-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* View Mode Toggle Switcher */}
        <div className="flex items-center gap-1 bg-zinc-950/80 p-1 rounded-lg border border-zinc-800/80">
          <button
            onClick={() => setViewMode('table')}
            title="Visão em Tabela"
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'table' ? 'bg-zinc-800 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <LayoutList className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            title="Visão em Grade / Cards"
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'grid' ? 'bg-zinc-800 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Filters & Search Control Bar ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 items-center">
        {/* Search Input */}
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por título, slug..."
            className="w-full rounded-lg border border-zinc-700/80 bg-zinc-800/90 py-2 pl-9 pr-8 text-xs text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Google Index Filter */}
        <div>
          <select
            value={indexFilter}
            onChange={(e) => setIndexFilter(e.target.value as IndexFilterType)}
            className="w-full rounded-lg border border-zinc-700/80 bg-zinc-800/90 py-2 px-3 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none transition-colors"
          >
            <option value="all">Indexação (Todos)</option>
            <option value="PASS">✓ Indexados (PASS)</option>
            <option value="NEUTRAL">⚠️ Não Indexados (NEUTRAL)</option>
            <option value="FAIL">✕ Com Erros (FAIL)</option>
            <option value="PARTIAL">! Parcial (PARTIAL)</option>
            <option value="UNCHECKED">? Não Consultados</option>
            <option value="REQUESTED">⚡ Fast Index Solicitado</option>
          </select>
        </div>

        {/* Date Filter */}
        <div>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
            className="w-full rounded-lg border border-zinc-700/80 bg-zinc-800/90 py-2 px-3 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none transition-colors"
          >
            <option value="all">Período (Todas)</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="this_month">Este Mês</option>
            <option value="this_year">Este Ano</option>
          </select>
        </div>

        {/* Sort By Dropdown */}
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortByType)}
            className="w-full rounded-lg border border-zinc-700/80 bg-zinc-800/90 py-2 px-3 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none transition-colors"
          >
            <option value="created_desc">Ordenar: Mais Recente</option>
            <option value="created_asc">Ordenar: Mais Antigo</option>
            <option value="title_asc">Título (A-Z)</option>
            <option value="title_desc">Título (Z-A)</option>
            {hasMetrics && (
              <>
                <option value="clicks_desc">Maior N° Cliques GSC</option>
                <option value="impressions_desc">Maior N° Impressões GSC</option>
                <option value="position_asc">Melhor Posição GSC</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Active Filter Indicators & Reset Button */}
      {isFilterActive && (
        <div className="flex items-center justify-between rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-3 py-2 text-xs text-indigo-300">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-indigo-400" />
            <span>Filtros ativos marcados — <strong>{filteredAndSortedPosts.length}</strong> artigos encontrados</span>
          </div>
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-200 hover:underline transition-colors"
          >
            <RotateCcw className="h-3 w-3" /> Limpar Filtros
          </button>
        </div>
      )}

      {/* ── Batch Action Bar ── */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 backdrop-blur-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-sm text-indigo-300 font-semibold">
              <CheckSquare className="h-4 w-4 text-indigo-400" />
              {selectedIds.size} {selectedIds.size === 1 ? 'artigo selecionado' : 'artigos selecionados'}
            </span>
            <button
              onClick={toggleSelectAllFiltered}
              className="text-xs text-zinc-400 hover:text-white underline transition-colors"
            >
              {selectedIds.size === filteredAndSortedPosts.length ? 'Desmarcar todos' : `Selecionar todos (${filteredAndSortedPosts.length})`}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchInspect}
              disabled={isProcessing}
              className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <SearchCheck className="h-3.5 w-3.5" />}
              Consultar GSC (Batch)
            </button>
            <button
              onClick={handleBatchIndex}
              disabled={isProcessing}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 shadow-md shadow-indigo-600/30"
            >
              {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
              Solicitar Indexação (Batch)
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="p-1.5 text-zinc-400 hover:text-zinc-100"
              title="Cancelar seleção"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Content View: Table vs Grid ── */}
      {!paginatedPosts.length ? (
        <div className="empty-state border border-zinc-800 rounded-xl bg-zinc-900/50 my-6">
          <div className="empty-state-icon">
            <FileText className="h-6 w-6 text-zinc-500" />
          </div>
          <p className="text-zinc-300 font-medium">Nenhum artigo encontrado</p>
          <p className="text-xs text-zinc-500 mt-1">Tente ajustar seus termos de pesquisa ou filtros.</p>
          {isFilterActive && (
            <button
              onClick={resetFilters}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600/20 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/30 transition-colors border border-indigo-500/30"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Resetar Todos os Filtros
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedPosts.map((post) => (
            <PostGridCard
              key={post.id}
              post={post}
              gsc={post.gsc}
              isSelected={selectedIds.has(post.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3 font-medium w-10">
                  <input
                    type="checkbox"
                    checked={paginatedPosts.length > 0 && paginatedPosts.every(p => selectedIds.has(p.id))}
                    onChange={toggleSelectPage}
                    className="rounded border-zinc-700 bg-zinc-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-900"
                  />
                </th>
                <th className="px-4 py-3 font-medium">Título</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Google Index</th>
                {hasMetrics && (
                  <>
                    <th className="px-4 py-3 font-medium text-center">Cliques</th>
                    <th className="px-4 py-3 font-medium text-center">Impressões</th>
                    <th className="px-4 py-3 font-medium text-center">Pos.</th>
                  </>
                )}
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {paginatedPosts.map((post) => (
                <PostTableRow
                  key={post.id}
                  post={post}
                  gsc={post.gsc}
                  isSelected={selectedIds.has(post.id)}
                  onToggleSelect={toggleSelect}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Senior Footer Pagination Controls ── */}
      {filteredAndSortedPosts.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-800 pt-4 px-2 text-xs text-zinc-400">
          {/* Page Size & Summary */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span>Exibir</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-md border border-zinc-700 bg-zinc-800 py-1 px-2 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>por página</span>
            </div>
            <span className="text-zinc-600">•</span>
            <div>
              Exibindo <strong className="text-zinc-200">{startIndex + 1}</strong>–<strong className="text-zinc-200">{endIndex}</strong> de <strong className="text-zinc-200">{totalItems}</strong> artigos
            </div>
          </div>

          {/* Page Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              title="Primeira Página"
              className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              title="Página Anterior"
              className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="px-3 py-1 text-xs font-medium text-zinc-300">
              Página <strong className="text-indigo-400">{currentPage}</strong> de <strong>{totalPages}</strong>
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              title="Próxima Página"
              className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              title="Última Página"
              className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
