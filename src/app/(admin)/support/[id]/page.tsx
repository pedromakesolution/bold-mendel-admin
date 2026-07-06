import { createAdminClient } from '@/lib/supabase-admin'
import { requireAdminSession } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft, UserCircle, Shield, CheckCircle2, Paperclip } from 'lucide-react'
import type { Metadata } from 'next'
import { AdminTicketActions } from './AdminTicketActions'

export const metadata: Metadata = {
  title: 'Ticket — Freela Dock Admin',
}

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = {
  open:         'Aberto',
  in_progress:  'Em andamento',
  waiting_user: 'Aguardando usuário',
  resolved:     'Resolvido',
  closed:       'Fechado',
}

const CATEGORY_LABEL: Record<string, string> = {
  bug:             '🐛 Bug / Erro',
  question:        '💬 Dúvida',
  feature_request: '✨ Sugestão',
  billing:         '💳 Cobrança',
  other:           '📋 Outro',
}

const PRIORITY_LABEL: Record<string, string> = {
  low:    'Baixa',
  normal: 'Normal',
  high:   'Alta',
  urgent: 'Urgente',
}

function formatDatetime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day:    '2-digit',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  })
}

async function getTicketDetail(id: string) {
  const supabase = createAdminClient()

  const [ticketRes, messagesRes] = await Promise.all([
    supabase
      .from('support_tickets')
      .select(`
        *,
        user:profiles!support_tickets_user_id_fkey(id, full_name, email, plan)
      `)
      .eq('id', id)
      .single(),

    supabase
      .from('support_ticket_messages')
      .select('*')
      // Admin vê tudo, incluindo is_internal = true
      .eq('ticket_id', id)
      .order('created_at', { ascending: true }),
  ])

  return {
    ticket:   ticketRes.data,
    messages: messagesRes.data ?? [],
    error:    ticketRes.error,
  }
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireAdminSession()
  const { id }  = await params
  const { ticket, messages, error } = await getTicketDetail(id)

  if (error || !ticket) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <p className="text-zinc-500">Ticket não encontrado.</p>
        <Link href="/support" className="mt-4 text-sm text-indigo-400 hover:text-indigo-300">
          ← Voltar para Suporte
        </Link>
      </div>
    )
  }

  const user = ticket.user as any
  const isAssignedToMe = ticket.assigned_admin_id === session.user.id

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      {/* Back */}
      <Link
        href="/support"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Suporte
      </Link>

      {/* Ticket header */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-zinc-100">{ticket.subject}</h1>
            <p className="text-sm text-zinc-500">
              Protocolo: <span className="font-mono text-zinc-400">{ticket.id.slice(0, 8).toUpperCase()}</span>
              {' · '}{CATEGORY_LABEL[ticket.category]}
              {' · '}Prioridade: <span className="text-zinc-300">{PRIORITY_LABEL[ticket.priority]}</span>
            </p>
          </div>
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
            ticket.status === 'open'         ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
            ticket.status === 'in_progress'  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
            ticket.status === 'waiting_user' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
            ticket.status === 'resolved'     ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            'bg-zinc-700/30 text-zinc-500 border-zinc-700/30'
          }`}>
            {STATUS_LABEL[ticket.status]}
          </span>
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
          <UserCircle className="h-8 w-8 text-zinc-600" />
          <div>
            <p className="text-sm font-medium text-zinc-200">{user?.full_name ?? 'Usuário desconhecido'}</p>
            <p className="text-xs text-zinc-500">{user?.email ?? '—'} · Plano: {user?.plan ?? 'free'}</p>
          </div>
        </div>
      </div>

      {/* Actions (assume ticket, change status/priority) */}
      <AdminTicketActions
        ticketId={ticket.id}
        currentStatus={ticket.status}
        currentPriority={ticket.priority}
        assignedAdminId={ticket.assigned_admin_id}
        currentAdminId={session.user.id}
        isAssignedToMe={isAssignedToMe}
      />

      {/* Thread */}
      <div className="space-y-3">
        {/* Mensagem original */}
        <MessageBubble
          role="user"
          body={ticket.body}
          attachments={ticket.attachments ?? []}
          datetime={ticket.created_at}
          authorName={user?.full_name ?? 'Usuário'}
          isFirst
        />

        {messages.map((msg: any) => (
          <MessageBubble
            key={msg.id}
            role={msg.author_role}
            body={msg.body}
            attachments={msg.attachments ?? []}
            datetime={msg.created_at}
            isInternal={msg.is_internal}
            authorName={msg.author_role === 'admin' ? 'Freela Dock Suporte' : (user?.full_name ?? 'Usuário')}
          />
        ))}
      </div>
    </div>
  )
}

// ── Message Bubble ─────────────────────────────────────────────

interface MessageBubbleProps {
  role: 'user' | 'admin'
  body: string
  attachments: string[]
  datetime: string
  authorName: string
  isFirst?: boolean
  isInternal?: boolean
}

function MessageBubble({ role, body, attachments, datetime, authorName, isFirst, isInternal }: MessageBubbleProps) {
  const isAdmin = role === 'admin'

  return (
    <div className={[
      'rounded-xl border p-4 space-y-3',
      isInternal
        ? 'border-yellow-500/20 bg-yellow-500/5'
        : isAdmin
          ? 'border-indigo-500/20 bg-indigo-500/5'
          : 'border-zinc-800 bg-zinc-900',
    ].join(' ')}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-medium">
          {isAdmin
            ? <Shield className="h-3.5 w-3.5 text-indigo-400" />
            : <UserCircle className="h-3.5 w-3.5 text-zinc-500" />}
          <span className={isAdmin ? 'text-indigo-300' : 'text-zinc-400'}>
            {authorName}
            {isFirst && !isAdmin && ' (mensagem inicial)'}
          </span>
          {isInternal && (
            <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-400">
              NOTA INTERNA
            </span>
          )}
        </div>
        <time className="text-[11px] text-zinc-600">{formatDatetime(datetime)}</time>
      </div>

      <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{body}</p>

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {attachments.map((url, i) => {
            const isImage = /\.(png|jpg|jpeg|webp)$/i.test(url)
            return isImage ? (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                <img
                  src={url}
                  alt={`Anexo ${i + 1}`}
                  className="h-24 w-32 rounded-lg object-cover border border-zinc-700 hover:opacity-80 transition-opacity"
                />
              </a>
            ) : (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <Paperclip className="h-3.5 w-3.5" />
                Anexo {i + 1}
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
