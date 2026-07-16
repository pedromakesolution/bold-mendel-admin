'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Pencil, Globe, Archive, ExternalLink, Loader2, SearchCheck, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { publishPost, archivePost, deletePost } from '@/app/actions/blog'
import { checkPostIndexStatus } from '@/app/actions/indexing'
import { DeletePostButton } from './DeletePostButton'
import type { Post } from '@/lib/blog-admin-client'
import type { PostGscMetric } from '@/lib/google-search-console'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://freeladock.com.br'

const STATUS_BADGE: Record<Post['status'], { label: string; className: string }> = {
  draft:     { label: 'Rascunho',  className: 'badge-slate'   },
  published: { label: 'Publicado', className: 'badge-emerald' },
  archived:  { label: 'Arquivado', className: 'badge-amber'   },
}

function PerformanceBadge({ clicks, impressions }: { clicks: number; impressions: number }) {
  if (impressions === 0) return <span className="text-zinc-600 text-xs">—</span>
  if (clicks >= 50)  return <span className="gsc-badge-excellent">{clicks.toLocaleString('pt-BR')}</span>
  if (clicks >= 10)  return <span className="gsc-badge-good">{clicks.toLocaleString('pt-BR')}</span>
  if (clicks > 0)    return <span className="gsc-badge-fair">{clicks.toLocaleString('pt-BR')}</span>
  return <span className="text-zinc-600 text-xs">0</span>
}

function PositionCell({ pos }: { pos: number }) {
  if (pos === 0) return <span className="text-zinc-600 text-xs">—</span>
  const color = pos <= 3 ? 'text-emerald-400' : pos <= 10 ? 'text-sky-400' : pos <= 20 ? 'text-amber-400' : 'text-zinc-500'
  return <span className={`text-xs font-semibold tabular-nums ${color}`}>{pos.toFixed(1)}</span>
}

export function PostTableRow({ post, gsc }: { post: Post; gsc?: PostGscMetric }) {
  const [isPending, startTransition] = useTransition()
  const badge = STATUS_BADGE[post.status as Post['status']]

  // Index Status Mapping
  const renderIndexStatus = () => {
    if (isPending) {
      return (
        <span className="flex items-center gap-1.5 text-xs text-zinc-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
          Verificando
        </span>
      )
    }

    if (!post.google_index_status) {
      return (
        <button
          onClick={() => startTransition(() => checkPostIndexStatus(post.id, post.slug))}
          className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-2 py-1 rounded-md"
        >
          <SearchCheck className="h-3.5 w-3.5" />
          Consultar
        </button>
      )
    }

    if (post.google_index_status === 'PASS') {
      return (
        <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md cursor-help" title={`Verificado em ${new Date(post.google_index_checked_at!).toLocaleDateString('pt-BR')}`}>
          <CheckCircle2 className="h-3.5 w-3.5" />
          Indexado
        </span>
      )
    }

    if (post.google_index_status === 'FAIL') {
      return (
        <span className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-md cursor-help" title="A página possui erros críticos que impedem a indexação.">
          <XCircle className="h-3.5 w-3.5" />
          Com Erros
        </span>
      )
    }

    return (
      <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md cursor-help" title={`Status: ${post.google_index_status}`}>
        <AlertCircle className="h-3.5 w-3.5" />
        Pendente
      </span>
    )
  }

  return (
    <tr className="group table-row-hover">
      <td className="px-4 py-3">
        <div>
          <span className="block font-medium text-zinc-100 line-clamp-1 text-sm">
            {post.title}
          </span>
          <code className="text-[10px] text-zinc-600">{post.slug}</code>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`badge ${badge.className}`}>{badge.label}</span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        {renderIndexStatus()}
      </td>

      {gsc ? (
        <>
          <td className="px-4 py-3 text-center">
            <PerformanceBadge clicks={gsc.clicks} impressions={gsc.impressions} />
          </td>
          <td className="px-4 py-3 text-center">
            {gsc.impressions > 0
              ? <span className="text-xs text-zinc-400 tabular-nums">{gsc.impressions.toLocaleString('pt-BR')}</span>
              : <span className="text-zinc-600 text-xs">—</span>
            }
          </td>
          <td className="px-4 py-3 text-center">
            <PositionCell pos={gsc.position} />
          </td>
        </>
      ) : (
        <>
          <td className="px-4 py-3 text-center text-zinc-600 text-xs">—</td>
          <td className="px-4 py-3 text-center text-zinc-600 text-xs">—</td>
          <td className="px-4 py-3 text-center text-zinc-600 text-xs">—</td>
        </>
      )}

      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          {post.status === 'published' && (
            <a
              href={`${SITE_URL}/blog/${post.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir no site"
              className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-blue-900/30 hover:text-blue-400"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <Link
            href={`/blog/${post.id}/editar`}
            title="Editar"
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-100"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Link>
          {post.status !== 'published' && (
            <form action={publishPost.bind(null, post.id, post.slug)}>
              <button
                type="submit"
                title="Publicar"
                className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-emerald-900/30 hover:text-emerald-400"
              >
                <Globe className="h-3.5 w-3.5" />
              </button>
            </form>
          )}
          {post.status !== 'archived' && (
            <form action={archivePost.bind(null, post.id, post.slug)}>
              <button
                type="submit"
                title="Arquivar"
                className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-yellow-900/30 hover:text-yellow-400"
              >
                <Archive className="h-3.5 w-3.5" />
              </button>
            </form>
          )}
          <form action={deletePost.bind(null, post.id, post.slug)}>
            <DeletePostButton />
          </form>
        </div>
      </td>
    </tr>
  )
}
