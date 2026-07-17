'use client'

import { useState } from 'react'
import { PostTableRow } from './PostTableRow'
import { submitBatchToIndex, checkBatchIndexStatus } from '@/app/actions/indexing'
import { SearchCheck, Globe, Loader2, CheckSquare } from 'lucide-react'
import type { Post } from '@/lib/blog-admin-client'
import type { SearchConsoleMetrics } from '@/lib/google-search-console'

export type PostWithMetrics = Post & { gsc?: SearchConsoleMetrics }

export function BlogTableClient({ posts, hasMetrics }: { posts: PostWithMetrics[], hasMetrics: boolean }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === posts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(posts.map(p => p.id)))
    }
  }

  const handleBatchInspect = async () => {
    if (selectedIds.size === 0) return
    setIsProcessing(true)
    const items = posts.filter(p => selectedIds.has(p.id)).map(p => ({ id: p.id, slug: p.slug }))
    try {
      const res = await checkBatchIndexStatus(items)
      if (res.error) alert(res.error)
      else {
        alert('Status verificados com sucesso.')
        setSelectedIds(new Set()) // clear selection on success
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
    <>
      {/* Batch Action Bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 backdrop-blur-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-2 text-sm text-indigo-300 font-medium">
            <CheckSquare className="h-4 w-4" />
            {selectedIds.size} {selectedIds.size === 1 ? 'artigo selecionado' : 'artigos selecionados'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchInspect}
              disabled={isProcessing}
              className="flex items-center gap-2 rounded-lg bg-zinc-800/80 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <SearchCheck className="h-3.5 w-3.5" />}
              Consultar Status
            </button>
            <button
              onClick={handleBatchIndex}
              disabled={isProcessing}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 shadow-sm"
            >
              {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
              Solicitar Indexação
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3 font-medium w-10">
                <input 
                  type="checkbox"
                  checked={selectedIds.size > 0 && selectedIds.size === posts.length}
                  onChange={toggleSelectAll}
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
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {posts.map((post) => (
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
    </>
  )
}
