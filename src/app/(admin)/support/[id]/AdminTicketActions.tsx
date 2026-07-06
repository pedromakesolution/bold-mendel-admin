'use client'

/**
 * AdminTicketActions
 *
 * Client Component com todas as ações interativas da página de detalhe do ticket:
 * - Assumir ticket (assign_admin_id)
 * - Mudar status e prioridade
 * - Responder (pública ou nota interna)
 * - Upload de anexos
 */

import { useState, useTransition } from 'react'
import { Send, Loader2, UserCheck, ChevronDown } from 'lucide-react'
import {
  assumeTicket,
  replyToTicket,
  updateTicketStatus,
  updateTicketPriority,
} from '@/app/actions/support'

const STATUS_OPTIONS = [
  { value: 'open',         label: 'Aberto' },
  { value: 'in_progress',  label: 'Em andamento' },
  { value: 'waiting_user', label: 'Aguardando usuário' },
  { value: 'resolved',     label: 'Resolvido' },
  { value: 'closed',       label: 'Fechado' },
] as const

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Baixa' },
  { value: 'normal', label: 'Normal' },
  { value: 'high',   label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
] as const

interface Props {
  ticketId: string
  currentStatus: string
  currentPriority: string
  assignedAdminId: string | null
  currentAdminId: string
  isAssignedToMe: boolean
}

export function AdminTicketActions({
  ticketId,
  currentStatus,
  currentPriority,
  assignedAdminId,
  currentAdminId,
  isAssignedToMe,
}: Props) {
  const [body,        setBody]        = useState('')
  const [isInternal,  setIsInternal]  = useState(false)
  const [replyError,  setReplyError]  = useState<string | null>(null)
  const [isPending,   startTransition] = useTransition()

  async function handleReply(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setReplyError(null)
    startTransition(async () => {
      const result = await replyToTicket({
        ticketId,
        body: body.trim(),
        isInternal,
        authorId: currentAdminId,
      })
      if (result.error) {
        setReplyError(result.error)
      } else {
        setBody('')
        setIsInternal(false)
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Management bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        {/* Assume ticket */}
        {!assignedAdminId && (
          <form action={assumeTicket.bind(null, ticketId, currentAdminId)}>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              <UserCheck className="h-4 w-4" />
              Assumir ticket
            </button>
          </form>
        )}
        {isAssignedToMe && (
          <span className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-sm text-indigo-300">
            <UserCheck className="h-4 w-4" />
            Atribuído a mim
          </span>
        )}
        {assignedAdminId && !isAssignedToMe && (
          <span className="text-sm text-zinc-500">Atribuído a outro admin</span>
        )}

        <div className="ml-auto flex flex-wrap gap-2">
          {/* Status selector */}
          <form action={updateTicketStatus.bind(null, ticketId)}>
            <div className="relative">
              <select
                name="status"
                defaultValue={currentStatus}
                onChange={(e) => {
                  const form = e.currentTarget.form
                  if (form) {
                    const data = new FormData(form)
                    updateTicketStatus(ticketId, data)
                  }
                }}
                className="appearance-none rounded-lg border border-zinc-700 bg-zinc-800 pl-3 pr-8 py-2 text-sm text-zinc-300 outline-none focus:border-indigo-500 cursor-pointer"
              >
                {STATUS_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            </div>
          </form>

          {/* Priority selector */}
          <form action={updateTicketPriority.bind(null, ticketId)}>
            <div className="relative">
              <select
                name="priority"
                defaultValue={currentPriority}
                onChange={(e) => {
                  const form = e.currentTarget.form
                  if (form) {
                    const data = new FormData(form)
                    updateTicketPriority(ticketId, data)
                  }
                }}
                className="appearance-none rounded-lg border border-zinc-700 bg-zinc-800 pl-3 pr-8 py-2 text-sm text-zinc-300 outline-none focus:border-indigo-500 cursor-pointer"
              >
                {PRIORITY_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            </div>
          </form>
        </div>
      </div>

      {/* Reply form */}
      {!['resolved', 'closed'].includes(currentStatus) && (
        <form onSubmit={handleReply} className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Responder</p>
            {/* Internal note toggle */}
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
              <span className={isInternal ? 'text-yellow-400' : 'text-zinc-500'}>
                {isInternal ? '🔒 Nota interna (visível só para admins)' : 'Resposta pública'}
              </span>
              <div
                onClick={() => setIsInternal(!isInternal)}
                className={[
                  'relative h-5 w-9 rounded-full transition-colors duration-200 cursor-pointer',
                  isInternal ? 'bg-yellow-500' : 'bg-zinc-700',
                ].join(' ')}
              >
                <span className={[
                  'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-200',
                  isInternal ? 'translate-x-4' : 'translate-x-0',
                ].join(' ')} />
              </div>
            </label>
          </div>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={10000}
            required
            rows={4}
            placeholder={isInternal ? 'Nota interna — não será visível para o usuário...' : 'Escreva sua resposta para o usuário...'}
            className={[
              'w-full rounded-lg border px-4 py-2.5 text-sm text-zinc-100 resize-y outline-none transition-colors',
              isInternal
                ? 'border-yellow-500/30 bg-yellow-500/5 placeholder:text-yellow-700'
                : 'border-zinc-700 bg-zinc-800 placeholder:text-zinc-600 focus:border-indigo-500',
            ].join(' ')}
          />

          {replyError && (
            <p className="text-xs text-rose-400">{replyError}</p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending || !body.trim()}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isPending ? 'Enviando...' : isInternal ? 'Salvar nota' : 'Enviar resposta'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
