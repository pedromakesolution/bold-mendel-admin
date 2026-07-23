// Helper para integração com a API v3 da Brevo

const BREVO_API_URL = 'https://api.brevo.com/v3'

function getHeaders() {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    throw new Error('BREVO_API_KEY não configurada no servidor.')
  }
  return {
    'accept': 'application/json',
    'content-type': 'application/json',
    'api-key': apiKey,
  }
}

export interface CreateCampaignOptions {
  name: string
  subject: string
  htmlContent: string
  senderName?: string
  senderEmail?: string
  listIds?: number[]
  scheduledAt?: string // Formato ISO: YYYY-MM-DDTHH:mm:ss.SSSZ
}

export interface BrevoCampaignStats {
  uniqueViews: number
  clicks: number
  viewed: number
  delivered: number
  sent: number
  bounces: number
  unsubscriptions: number
}

/**
 * Cria uma nova campanha de e-mail marketing / newsletter na Brevo
 */
export async function createBrevoCampaign(options: CreateCampaignOptions) {
  const defaultSenderName = process.env.BREVO_DEFAULT_SENDER_NAME || 'Bold Mendel'
  const defaultSenderEmail = process.env.BREVO_DEFAULT_SENDER_EMAIL || 'contato@freeladock.com.br'
  const defaultListId = Number(process.env.BREVO_LIST_ID_NEWSLETTER || '3')

  const payload: Record<string, unknown> = {
    name: options.name,
    subject: options.subject,
    sender: {
      name: options.senderName || defaultSenderName,
      email: options.senderEmail || defaultSenderEmail,
    },
    htmlContent: options.htmlContent,
    recipients: {
      listIds: options.listIds && options.listIds.length > 0 ? options.listIds : [defaultListId],
    },
  }

  if (options.scheduledAt) {
    payload.scheduledAt = options.scheduledAt
  }

  const res = await fetch(`${BREVO_API_URL}/emailCampaigns`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.message || `Erro Brevo (${res.status}): Não foi possível criar a campanha.`)
  }

  return data as { id: number }
}

/**
 * Dispara um e-mail de teste para uma campanha criada na Brevo
 */
export async function sendBrevoTestEmail(campaignId: number, emailTo: string) {
  const res = await fetch(`${BREVO_API_URL}/emailCampaigns/${campaignId}/sendTest`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      emailTo: [emailTo],
    }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data?.message || `Erro Brevo (${res.status}): Falha ao enviar e-mail de teste.`)
  }

  return true
}

/**
 * Dispara a campanha de e-mail imediatamente
 */
export async function sendBrevoCampaignNow(campaignId: number) {
  const res = await fetch(`${BREVO_API_URL}/emailCampaigns/${campaignId}/sendNow`, {
    method: 'POST',
    headers: getHeaders(),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data?.message || `Erro Brevo (${res.status}): Falha ao disparar campanha.`)
  }

  return true
}

/**
 * Obtém detalhes e métricas de uma campanha na Brevo
 */
export async function getBrevoCampaignDetails(campaignId: number) {
  const res = await fetch(`${BREVO_API_URL}/emailCampaigns/${campaignId}`, {
    method: 'GET',
    headers: getHeaders(),
    next: { revalidate: 60 },
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data?.message || `Erro Brevo (${res.status}): Não foi possível buscar campanha.`)
  }

  return res.json()
}

/**
 * Obtém resumo e saldo da conta Brevo
 */
export async function getBrevoAccountSummary() {
  try {
    const res = await fetch(`${BREVO_API_URL}/account`, {
      method: 'GET',
      headers: getHeaders(),
      next: { revalidate: 300 },
    })

    if (!res.ok) return null
    return res.json()
  } catch (error) {
    console.error('Erro ao buscar conta Brevo:', error)
    return null
  }
}

/**
 * Obtém total de inscritos na lista de newsletter da Brevo
 */
export async function getBrevoNewsletterContactsCount() {
  try {
    const listId = Number(process.env.BREVO_LIST_ID_NEWSLETTER || '3')
    const res = await fetch(`${BREVO_API_URL}/contacts/lists/${listId}`, {
      method: 'GET',
      headers: getHeaders(),
      next: { revalidate: 300 },
    })

    if (!res.ok) return null
    const data = await res.json()
    return data?.uniqueSubscribers ?? data?.totalSubscribers ?? 0
  } catch (error) {
    console.error('Erro ao buscar contatos da lista Brevo:', error)
    return null
  }
}

export interface BrevoSender {
  id: number
  name: string
  email: string
  active?: boolean
}

export interface BrevoList {
  id: number
  name: string
  totalSubscribers?: number
  uniqueSubscribers?: number
}

/**
 * Busca remetentes cadastrados e verificados na Brevo
 */
export async function getBrevoSenders(): Promise<BrevoSender[]> {
  try {
    const res = await fetch(`${BREVO_API_URL}/senders`, {
      method: 'GET',
      headers: getHeaders(),
      next: { revalidate: 60 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data?.senders || []) as BrevoSender[]
  } catch (error) {
    console.error('Erro ao buscar remetentes da Brevo:', error)
    return []
  }
}

/**
 * Busca listas de contatos da Brevo
 */
export async function getBrevoLists(): Promise<BrevoList[]> {
  try {
    const res = await fetch(`${BREVO_API_URL}/contacts/lists?limit=50&offset=0`, {
      method: 'GET',
      headers: getHeaders(),
      next: { revalidate: 60 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data?.lists || []) as BrevoList[]
  } catch (error) {
    console.error('Erro ao buscar listas da Brevo:', error)
    return []
  }
}

/**
 * Dispara um Evento Customizado na Brevo para acionar um Workflow de Automação
 */
export async function trackBrevoEvent(options: {
  email: string
  eventName: string
  eventProperties?: Record<string, unknown>
}) {
  const res = await fetch(`${BREVO_API_URL}/events`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      email: options.email,
      event_name: options.eventName,
      properties: options.eventProperties || {},
    }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data?.message || `Erro Brevo (${res.status}): Falha ao disparar evento de automação.`)
  }

  return true
}

/**
 * Adiciona um contato a uma lista na Brevo (aciona workflows baseados em lista)
 */
export async function addBrevoContactToList(email: string, listId: number) {
  const res = await fetch(`${BREVO_API_URL}/contacts/lists/${listId}/contacts/add`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      emails: [email],
    }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data?.message || `Erro Brevo (${res.status}): Falha ao adicionar contato à lista.`)
  }

  return true
}

/**
 * Remove um contato de uma lista na Brevo
 */
export async function removeBrevoContactFromList(email: string, listId: number) {
  const res = await fetch(`${BREVO_API_URL}/contacts/lists/${listId}/contacts/remove`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      emails: [email],
    }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data?.message || `Erro Brevo (${res.status}): Falha ao remover contato da lista.`)
  }

  return true
}

/**
 * Envia e-mail transacional via template da Brevo com parâmetros dinâmicos
 */
export async function sendBrevoTransactionalTemplate(options: {
  email: string
  templateId: number
  params?: Record<string, unknown>
}) {
  const res = await fetch(`${BREVO_API_URL}/smtp/email`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      to: [{ email: options.email }],
      templateId: options.templateId,
      params: options.params || {},
    }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data?.message || `Erro Brevo (${res.status}): Falha ao enviar e-mail transacional.`)
  }

  return true
}


