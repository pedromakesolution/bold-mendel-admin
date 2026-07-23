'use client'

import { useState } from 'react'
import {
  Mail,
  Send,
  Calendar,
  Clock,
  Eye,
  MousePointer,
  RefreshCw,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  FileEdit,
} from 'lucide-react'
import {
  NewsletterItem,
  syncNewsletterStatsAction,
  deleteNewsletterAction,
} from '@/app/actions/social-media'

interface NewsletterListProps {
  newsletters: NewsletterItem[]
  onEdit: (item: NewsletterItem) => void
  onRefresh: () => void
}

export default function NewsletterList({ newsletters, onEdit, onRefresh }: NewsletterListProps) {
  const [loadingSyncId, setLoadingSyncId] = useState<string | null>(null)
  const [loadingDeleteId, setLoadingDeleteId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSync(item: NewsletterItem) {
    if (!item.brevo_campaign_id) return
    setLoadingSyncId(item.id)
    setMessage(null)

    const res = await syncNewsletterStatsAction(item.id, item.brevo_campaign_id)
    setLoadingSyncId(null)

    if (res.success) {
      setMessage({ type: 'success', text: 'Métricas da Brevo sincronizadas com sucesso!' })
      onRefresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Falha ao sincronizar métricas.' })
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza de que deseja excluir esta newsletter?')) return
    setLoadingDeleteId(id)
    setMessage(null)

    const res = await deleteNewsletterAction(id)
    setLoadingDeleteId(null)

    if (res.success) {
      setMessage({ type: 'success', text: 'Newsletter excluída.' })
      onRefresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Falha ao excluir.' })
    }
  }

  function getStatusBadge(status: NewsletterItem['status']) {
    switch (status) {
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> Enviada
          </span>
        )
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-400 border border-amber-500/20">
            <Calendar className="h-3 w-3" /> Agendada
          </span>
        )
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-700/50 px-2.5 py-1 text-[11px] font-medium text-zinc-300 border border-zinc-600/30">
            <FileEdit className="h-3 w-3" /> Rascunho
          </span>
        )
    }
  }

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`flex items-center justify-between rounded-lg p-3 text-xs ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-zinc-400 hover:text-zinc-200">
            ✕
          </button>
        </div>
      )}

      {newsletters.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Mail className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-zinc-200">Nenhuma newsletter encontrada</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Você ainda não criou nenhuma newsletter ou o banco ainda não possui registros.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800 rounded-2xl border border-zinc-800 bg-zinc-900/80 overflow-hidden shadow-xl">
          {newsletters.map((item) => (
            <div
              key={item.id}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 hover:bg-zinc-800/40 transition-colors"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h4 className="truncate text-base font-bold text-zinc-100">{item.title}</h4>
                  {getStatusBadge(item.status)}
                </div>

                <p className="truncate text-xs text-zinc-400">
                  <span className="font-semibold text-zinc-300">Assunto:</span> "{item.subject}"
                </p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Criada em {new Date(item.created_at).toLocaleDateString('pt-BR')}
                  </span>

                  {item.scheduled_at && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <Calendar className="h-3 w-3" />
                      Agendada para {new Date(item.scheduled_at).toLocaleString('pt-BR')}
                    </span>
                  )}

                  {item.sent_at && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Send className="h-3 w-3" />
                      Enviada em {new Date(item.sent_at).toLocaleString('pt-BR')}
                    </span>
                  )}
                </div>

                {/* Métricas Brevo (se enviada e sincronizada) */}
                {item.status === 'sent' && item.stats && (
                  <div className="mt-3 flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-2.5 text-xs">
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <Eye className="h-3.5 w-3.5 text-indigo-400" />
                      <span className="font-semibold">{item.stats.open_rate ?? 0}%</span> Abertura
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-300 border-l border-zinc-800 pl-4">
                      <MousePointer className="h-3.5 w-3.5 text-purple-400" />
                      <span className="font-semibold">{item.stats.click_rate ?? 0}%</span> Cliques
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-400 border-l border-zinc-800 pl-4">
                      <span>{item.stats.delivered ?? 0} entregues</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center gap-2 self-end md:self-center">
                {item.brevo_campaign_id && (
                  <button
                    onClick={() => handleSync(item)}
                    disabled={loadingSyncId === item.id}
                    title="Atualizar métricas da Brevo"
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loadingSyncId === item.id ? 'animate-spin' : ''}`} />
                    Sincronizar
                  </button>
                )}

                <button
                  onClick={() => onEdit(item)}
                  className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-500/20 transition-colors"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Editar
                </button>

                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={loadingDeleteId === item.id}
                  className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-1.5 text-rose-400 hover:bg-rose-500/20 disabled:opacity-50 transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
