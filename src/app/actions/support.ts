'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { requireAdminSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// ── Assumir ticket ─────────────────────────────────────────────

export async function assumeTicket(ticketId: string, adminId: string) {
  await requireAdminSession()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('support_tickets')
    .update({ assigned_admin_id: adminId, status: 'in_progress' })
    .eq('id', ticketId)

  if (error) throw new Error(error.message)
  revalidatePath(`/support/${ticketId}`)
  revalidatePath('/support')
}

// ── Responder ticket ───────────────────────────────────────────

export async function replyToTicket({
  ticketId,
  body,
  isInternal,
  authorId,
}: {
  ticketId: string
  body: string
  isInternal: boolean
  authorId: string
}): Promise<{ error?: string }> {
  await requireAdminSession()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('support_ticket_messages')
    .insert({
      ticket_id:   ticketId,
      author_id:   authorId,
      author_role: 'admin',
      body,
      is_internal: isInternal,
    })

  if (error) return { error: error.message }

  // Se for resposta pública, muda status para waiting_user (aguardando retorno do usuário)
  if (!isInternal) {
    await supabase
      .from('support_tickets')
      .update({ status: 'waiting_user' })
      .eq('id', ticketId)
      .in('status', ['open', 'in_progress'])
  }

  revalidatePath(`/support/${ticketId}`)
  return {}
}

// ── Atualizar status ───────────────────────────────────────────

export async function updateTicketStatus(ticketId: string, formData: FormData) {
  await requireAdminSession()
  const status = formData.get('status') as string
  if (!status) return

  const supabase = createAdminClient()
  await supabase
    .from('support_tickets')
    .update({ status })
    .eq('id', ticketId)

  revalidatePath(`/support/${ticketId}`)
  revalidatePath('/support')
}

// ── Atualizar prioridade ───────────────────────────────────────

export async function updateTicketPriority(ticketId: string, formData: FormData) {
  await requireAdminSession()
  const priority = formData.get('priority') as string
  if (!priority) return

  const supabase = createAdminClient()
  await supabase
    .from('support_tickets')
    .update({ priority })
    .eq('id', ticketId)

  revalidatePath(`/support/${ticketId}`)
  revalidatePath('/support')
}
