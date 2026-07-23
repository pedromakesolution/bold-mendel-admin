'use server'

import { createBlogAdminClient } from '@/lib/blog-admin-client'
import {
  createBrevoCampaign,
  sendBrevoTestEmail,
  sendBrevoCampaignNow,
  getBrevoAccountSummary,
  getBrevoNewsletterContactsCount,
  getBrevoCampaignDetails,
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
 * Busca todas as newsletters salvas no Supabase
 * e inclui resumo da conta Brevo e contatos
 */
export async function getNewslettersAction() {
  try {
    const supabase = createBlogAdminClient()
    const { data: newsletters, error } = await supabase
      .from('newsletters')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar newsletters do Supabase:', error)
      // Se a tabela ainda não existir no Supabase, retorna lista vazia amigavelmente
      if (error.code === '42P01') {
        return { newsletters: [], accountInfo: null, totalSubscribers: 0 }
      }
      throw new Error(error.message)
    }

    const [accountInfo, totalSubscribers] = await Promise.all([
      getBrevoAccountSummary(),
      getBrevoNewsletterContactsCount(),
    ])

    return {
      newsletters: (newsletters || []) as NewsletterItem[],
      accountInfo,
      totalSubscribers: totalSubscribers ?? 0,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao carregar newsletters.'
    console.error('getNewslettersAction error:', message)
    return { newsletters: [], accountInfo: null, totalSubscribers: 0, error: message }
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
}) {
  try {
    // 1. Cria uma campanha temporária ou usa existente na Brevo
    const campaign = await createBrevoCampaign({
      name: `[TESTE] ${data.title} - ${new Date().toLocaleTimeString('pt-BR')}`,
      subject: `[TESTE] ${data.subject}`,
      htmlContent: data.contentHtml,
      senderName: data.senderName,
      senderEmail: data.senderEmail,
    })

    // 2. Dispara e-mail de teste para o endereço informado
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
 * Agenda ou dispara imediatamente a newsletter para a lista da Brevo e salva no Supabase
 */
export async function scheduleOrSendNewsletterAction(data: {
  id?: string
  title: string
  subject: string
  senderName: string
  senderEmail: string
  contentMarkdown: string
  contentHtml: string
  scheduledAt?: string // ISO format
}) {
  try {
    const supabase = createBlogAdminClient()

    // 1. Criar a campanha na Brevo
    const campaign = await createBrevoCampaign({
      name: data.title,
      subject: data.subject,
      htmlContent: data.contentHtml,
      senderName: data.senderName,
      senderEmail: data.senderEmail,
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
        : 'Newsletter enviada com sucesso para toda a lista da Brevo!',
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
      open_rate: statistics.viewed ? Math.round((statistics.uniqueViews / statistics.delivered) * 100) : 0,
      click_rate: statistics.clicks ? Math.round((statistics.clicks / statistics.delivered) * 100) : 0,
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
