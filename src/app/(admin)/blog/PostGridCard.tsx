'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Pencil, Globe, Archive, ExternalLink, Loader2, SearchCheck,
  CheckCircle2, XCircle, AlertCircle, Zap, Calendar, Eye,
  MousePointerClick, BarChart3
} from 'lucide-react'
import { publishPost, archivePost, deletePost } from '@/app/actions/blog'
import { checkPostIndexStatus } from '@/app/actions/indexing'
import { DeletePostButton } from './DeletePostButton'
import type { Post } from '@/lib/blog-admin-client'
import type { SearchConsoleMetrics } from '@/lib/google-search-console'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://freeladock.com.br'

const STATUS_BADGE: Record<Post['status'], { label: string; className: string }> = {
  draft:     { label: 'Rascunho',  className: 'badge-slate'   },
  published: { label: 'Publicado', className: 'badge-emerald' },
  archived:  { label: 'Arquivado', className: 'badge-amber'   },
}

export function PostGridCard({
  post,
  gsc,
  isSelected,
  onToggleSelect,
}: {
  post: Post & { gsc?: SearchConsoleMetrics }
  gsc?: SearchConsoleMetrics
  isSelected?: boolean
  onToggleSelect?: (id: string, slug: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const badge = STATUS_BADGE[post.status as Post['status']] || { label: post.status, className: 'badge-slate' }

  const [localVerdict, setLocalVerdict] = useState<string | null>(post.google_index_status)
  const [localCheckedAt, setLocalCheckedAt] = useState<string | null>(post.google_index_checked_at)
  const [localData, setLocalData] = useState<any>(null)

  const formattedDate = post.created_at
    ? new Date(post.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  const renderIndexStatus = () => {
    if (isPending) {
      return (
        <span className="flex items-center gap-1.5 text-xs text-zinc-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
          Verificando
        </span>
      )
    }

    if (!localVerdict) {
      return (
        <button
          onClick={() => startTransition(async () => {
            const res = await checkPostIndexStatus(post.id, post.slug)
            if (res.error) {
              alert(`Erro na API do Google: ${res.error}`)
            } else {
              setLocalVerdict(res.verdict || 'UNKNOWN')
              setLocalCheckedAt(new Date().toISOString())
              setLocalData(res.data)
            }
          })}
          className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-2 py-0.5 rounded"
        >
          <SearchCheck className="h-3 w-3" />
          Consultar
        </button>
      )
    }

    let details = `Verificado em ${new Date(localCheckedAt!).toLocaleDateString('pt-BR')}`
    if (localData?.coverageState) details += `\nCobertura: ${localData.coverageState}`

    if (localVerdict === 'PASS') {
      return (
        <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded cursor-help" title={details}>
          <CheckCircle2 className="h-3 w-3" />
          Indexado
        </span>
      )
    }

    if (localVerdict === 'FAIL') {
      return (
        <span className="flex items-center gap-1 text-[11px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded cursor-help" title={`${details}\nErros críticos`}>
          <XCircle className="h-3 w-3" />
          Com Erros
        </span>
      )
    }

    if (localVerdict === 'PARTIAL') {
      return (
        <span className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded cursor-help" title={details}>
          <AlertCircle className="h-3 w-3" />
          Parcial
        </span>
      )
    }

    return (
      <span className="flex items-center gap-1 text-[11px] text-zinc-400 bg-zinc-500/10 px-2 py-0.5 rounded cursor-help" title={details}>
        <AlertCircle className="h-3 w-3" />
        {localVerdict === 'NEUTRAL' ? 'Não Indexado' : localVerdict}
      </span>
    )
  }

  return (
    <div className={`group relative flex flex-col justify-between rounded-xl border bg-zinc-900/90 p-5 transition-all hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5 ${
      isSelected ? 'border-indigo-500 bg-indigo-500/5' : 'border-zinc-800'
    }`}>
      {/* Top Header Card: Checkbox + Status Badges */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            {onToggleSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(post.id, post.slug)}
                className="rounded border-zinc-700 bg-zinc-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-900 cursor-pointer"
              />
            )}
            <span className={`badge ${badge.className}`}>{badge.label}</span>
          </div>

          <div>{renderIndexStatus()}</div>
        </div>

        {/* Title and Slug */}
        <h3 className="text-base font-semibold text-zinc-100 line-clamp-2 leading-snug group-hover:text-indigo-300 transition-colors">
          {post.title}
        </h3>
        <code className="text-[11px] text-zinc-500 block mt-1 truncate">/{post.slug}</code>

        {post.google_index_requested_at && (
          <span
            className="inline-flex items-center gap-1 mt-2 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-500/15"
            title={`Solicitado em ${new Date(post.google_index_requested_at).toLocaleString('pt-BR')}`}
          >
            <Zap className="h-3 w-3 fill-amber-400" />
            Indexação Solicitada
          </span>
        )}
      </div>

      {/* Card Footer Section: Metrics + Actions */}
      <div className="mt-5 pt-4 border-t border-zinc-800/80">
        {/* Metrics Grid */}
        {gsc ? (
          <div className="grid grid-cols-3 gap-2 mb-4 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60 text-center">
            <div>
              <span className="flex items-center justify-center gap-1 text-[10px] text-zinc-500 mb-0.5">
                <MousePointerClick className="h-3 w-3 text-indigo-400" /> Cliques
              </span>
              <span className="text-xs font-bold text-indigo-300">{gsc.clicks.toLocaleString('pt-BR')}</span>
            </div>
            <div>
              <span className="flex items-center justify-center gap-1 text-[10px] text-zinc-500 mb-0.5">
                <Eye className="h-3 w-3 text-sky-400" /> Impressões
              </span>
              <span className="text-xs font-bold text-sky-300">{gsc.impressions.toLocaleString('pt-BR')}</span>
            </div>
            <div>
              <span className="flex items-center justify-center gap-1 text-[10px] text-zinc-500 mb-0.5">
                <BarChart3 className="h-3 w-3 text-amber-400" /> Pos.
              </span>
              <span className="text-xs font-bold text-amber-300">{gsc.position > 0 ? gsc.position.toFixed(1) : '—'}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-4">
            <Calendar className="h-3.5 w-3.5 text-zinc-600" />
            Criado em {formattedDate}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-zinc-500 flex items-center gap-1">
            <Calendar className="h-3 w-3 text-zinc-600" />
            {formattedDate}
          </span>

          <div className="flex items-center gap-1">
            {post.status === 'published' && (
              <a
                href={`${SITE_URL}/blog/${post.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir no site"
                className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-blue-900/30 hover:text-blue-400"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            <Link
              href={`/blog/${post.id}/editar`}
              title="Editar post"
              className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            >
              <Pencil className="h-4 w-4" />
            </Link>
            {post.status !== 'published' && (
              <form action={publishPost.bind(null, post.id, post.slug)}>
                <button
                  type="submit"
                  title="Publicar post"
                  className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-emerald-900/30 hover:text-emerald-400"
                >
                  <Globe className="h-4 w-4" />
                </button>
              </form>
            )}
            {post.status !== 'archived' && (
              <form action={archivePost.bind(null, post.id, post.slug)}>
                <button
                  type="submit"
                  title="Arquivar post"
                  className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-amber-900/30 hover:text-amber-400"
                >
                  <Archive className="h-4 w-4" />
                </button>
              </form>
            )}
            <form action={deletePost.bind(null, post.id, post.slug)}>
              <DeletePostButton />
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
