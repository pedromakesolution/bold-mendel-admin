'use server'

import { createBlogAdminClient } from '@/lib/blog-admin-client'
import {
  createBrevoCampaign,
  sendBrevoTestEmail,
  sendBrevoCampaignNow,
  getBrevoAccountSummary,
  getBrevoNewsletterContactsCount,
  getBrevoCampaignDetails,
  getBrevoSenders,
  getBrevoLists,
  BrevoSender,
  BrevoList,
} from '@/lib/brevo'
import { revalidatePath } from 'next/cache'

export interface NewsletterItem {
  id: string
  title: string
  subject: string
  sender_name: string
  sender_email: string
  content_markdown: string | null
  content_html: string
  list_ids?: number[] | null
  brevo_campaign_id: number | null
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled'
  scheduled_at: string | null
  sent_at: string | null
  stats: {
    open_rate?: number
    click_rate?: number
    delivered?: number
    unique_views?: number
    unsubscribes?: number
  } | null
  created_at: string
  updated_at: string | null
}

/**
 * Busca todas as newsletters salvas no Supabase,
 * resumo da conta, contatos, remetentes cadastrados e listas da Brevo
 */
export async function getNewslettersAction() {
  try {
    const supabase = createBlogAdminClient()
    const { data: newsletters, error } = await supabase
      .from('newsletters')
      .select('*')
      .order('created_at', { ascending: false })

    if (error && error.code !== '42P01') {
      console.error('Erro ao buscar newsletters do Supabase:', error)
    }

    const [accountInfo, totalSubscribers, senders, lists] = await Promise.all([
      getBrevoAccountSummary(),
      getBrevoNewsletterContactsCount(),
      getBrevoSenders(),
      getBrevoLists(),
    ])

    return {
      newsletters: (newsletters || []) as NewsletterItem[],
      accountInfo,
      totalSubscribers: totalSubscribers ?? 0,
      senders: senders as BrevoSender[],
      lists: lists as BrevoList[],
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao carregar newsletters.'
    console.error('getNewslettersAction error:', message)
    return {
      newsletters: [],
      accountInfo: null,
      totalSubscribers: 0,
      senders: [],
      lists: [],
      error: message,
    }
  }
}

/**
 * Salva ou atualiza um rascunho de newsletter no Supabase
 */
export async function saveNewsletterDraftAction(data: {
  id?: string
  title: string
  subject: string
  senderName: string
  senderEmail: string
  contentMarkdown: string
  contentHtml: string
  listIds?: number[]
}) {
  try {
    const supabase = createBlogAdminClient()
    const payload = {
      title: data.title,
      subject: data.subject,
      sender_name: data.senderName,
      sender_email: data.senderEmail,
      content_markdown: data.contentMarkdown,
      content_html: data.contentHtml,
      list_ids: data.listIds || [3],
      status: 'draft',
      updated_at: new Date().toISOString(),
    }

    let result
    if (data.id) {
      const { data: updated, error } = await supabase
        .from('newsletters')
        .update(payload)
        .eq('id', data.id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      result = updated
    } else {
      const { data: inserted, error } = await supabase
        .from('newsletters')
        .insert([{ ...payload, created_at: new Date().toISOString() }])
        .select()
        .single()
      if (error) throw new Error(error.message)
      result = inserted
    }

    revalidatePath('/social-media')
    return { success: true, newsletter: result as NewsletterItem }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao salvar rascunho.'
    return { success: false, error: message }
  }
}

/**
 * Envia um e-mail de teste via Brevo
 */
export async function sendTestNewsletterAction(data: {
  id?: string
  title: string
  subject: string
  senderName: string
  senderEmail: string
  contentHtml: string
  testEmail: string
  listIds?: number[]
}) {
  try {
    const campaign = await createBrevoCampaign({
      name: `[TESTE] ${data.title} - ${new Date().toLocaleTimeString('pt-BR')}`,
      subject: `[TESTE] ${data.subject}`,
      htmlContent: data.contentHtml,
      senderName: data.senderName,
      senderEmail: data.senderEmail,
      listIds: data.listIds && data.listIds.length > 0 ? data.listIds : [3],
    })

    await sendBrevoTestEmail(campaign.id, data.testEmail)

    return {
      success: true,
      message: `E-mail de teste enviado com sucesso para ${data.testEmail}!`,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao enviar e-mail de teste.'
    return { success: false, error: message }
  }
}

/**
 * Agenda ou dispara imediatamente a newsletter para as listas da Brevo e salva no Supabase
 */
export async function scheduleOrSendNewsletterAction(data: {
  id?: string
  title: string
  subject: string
  senderName: string
  senderEmail: string
  contentMarkdown: string
  contentHtml: string
  listIds?: number[]
  scheduledAt?: string // ISO format
}) {
  try {
    const supabase = createBlogAdminClient()
    const targetListIds = data.listIds && data.listIds.length > 0 ? data.listIds : [3]

    // 1. Criar a campanha na Brevo associada às listas selecionadas
    const campaign = await createBrevoCampaign({
      name: data.title,
      subject: data.subject,
      htmlContent: data.contentHtml,
      senderName: data.senderName,
      senderEmail: data.senderEmail,
      listIds: targetListIds,
      scheduledAt: data.scheduledAt || undefined,
    })

    // 2. Se não houver data de agendamento, disparar imediatamente
    if (!data.scheduledAt) {
      await sendBrevoCampaignNow(campaign.id)
    }

    const now = new Date().toISOString()
    const status = data.scheduledAt ? 'scheduled' : 'sent'

    const payload = {
      title: data.title,
      subject: data.subject,
      sender_name: data.senderName,
      sender_email: data.senderEmail,
      content_markdown: data.contentMarkdown,
      content_html: data.contentHtml,
      list_ids: targetListIds,
      brevo_campaign_id: campaign.id,
      status,
      scheduled_at: data.scheduledAt || null,
      sent_at: data.scheduledAt ? null : now,
      updated_at: now,
    }

    let savedNewsletter: NewsletterItem

    if (data.id) {
      const { data: updated, error } = await supabase
        .from('newsletters')
        .update(payload)
        .eq('id', data.id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      savedNewsletter = updated as NewsletterItem
    } else {
      const { data: inserted, error } = await supabase
        .from('newsletters')
        .insert([{ ...payload, created_at: now }])
        .select()
        .single()
      if (error) throw new Error(error.message)
      savedNewsletter = inserted as NewsletterItem
    }

    revalidatePath('/social-media')
    return {
      success: true,
      message: data.scheduledAt
        ? `Newsletter agendada com sucesso para ${new Date(data.scheduledAt).toLocaleString('pt-BR')}!`
        : `Newsletter enviada com sucesso para as ${targetListIds.length} lista(s) da Brevo!`,
      newsletter: savedNewsletter,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao disparar/agendar newsletter.'
    return { success: false, error: message }
  }
}

/**
 * Atualiza métricas de uma newsletter vindo da Brevo
 */
export async function syncNewsletterStatsAction(id: string, brevoCampaignId: number) {
  try {
    const details = await getBrevoCampaignDetails(brevoCampaignId)
    const statistics = details?.statistics?.globalStats || details?.statistics

    if (!statistics) {
      return { success: false, error: 'Métricas não encontradas na Brevo.' }
    }

    const supabase = createBlogAdminClient()
    const stats = {
      open_rate: statistics.delivered ? Math.round(((statistics.uniqueViews || statistics.viewed || 0) / statistics.delivered) * 100) : 0,
      click_rate: statistics.delivered ? Math.round(((statistics.clicks || 0) / statistics.delivered) * 100) : 0,
      delivered: statistics.delivered || 0,
      unique_views: statistics.uniqueViews || statistics.viewed || 0,
      unsubscribes: statistics.unsubscriptions || 0,
    }

    const { error } = await supabase
      .from('newsletters')
      .update({ stats, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw new Error(error.message)

    revalidatePath('/social-media')
    return { success: true, stats }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao sincronizar estatísticas.'
    return { success: false, error: message }
  }
}

/**
 * Exclui uma newsletter salva no Supabase
 */
export async function deleteNewsletterAction(id: string) {
  try {
    const supabase = createBlogAdminClient()
    const { error } = await supabase.from('newsletters').delete().eq('id', id)
    if (error) throw new Error(error.message)

    revalidatePath('/social-media')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao excluir newsletter.'
    return { success: false, error: message }
  }
}
