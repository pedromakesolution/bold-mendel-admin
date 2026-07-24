import 'server-only'

const INSTAGRAM_API_URL = 'https://graph.facebook.com/v19.0'

function getInstagramCredentials() {
  const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || '17841446640464548'
  const accessToken = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN || process.env.INSTAGRAM_ACCESS_TOKEN

  if (!accessToken) {
    throw new Error('INSTAGRAM_ACCESS_TOKEN não foi configurado no servidor (.env.local).')
  }

  return { accountId, accessToken }
}

export interface InstagramAccountInfo {
  id: string
  username: string
  name?: string
  profilePictureUrl?: string
  followersCount: number
  followsCount: number
  mediaCount: number
}

export interface InstagramMedia {
  id: string
  caption?: string
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  mediaUrl?: string
  permalink?: string
  timestamp: string
  likeCount: number
  commentsCount: number
}

export interface InstagramConversation {
  id: string
  updatedTime: string
  unreadCount: number
  participants: Array<{ id: string; username?: string; name?: string }>
  messages: Array<{
    id: string
    createdTime: string
    message: string
    from: { id: string; username?: string }
  }>
}

/**
 * Busca informações do perfil do Instagram Business via Meta Graph API (SERVER-ONLY)
 */
export async function getInstagramAccountInfo(): Promise<InstagramAccountInfo | null> {
  try {
    const { accountId, accessToken } = getInstagramCredentials()
    const url = `${INSTAGRAM_API_URL}/${accountId}?fields=id,username,name,profile_picture_url,followers_count,follows_count,media_count&access_token=${accessToken}`

    const res = await fetch(url, {
      method: 'GET',
      next: { revalidate: 300 }, // Cache por 5 minutos
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      console.error('Erro Meta Graph API (Account):', errorData)
      return null
    }

    const data = await res.json()
    return {
      id: data.id,
      username: data.username || 'boldmendel.oficial',
      name: data.name || 'Freela Dock - CRM para Freelancers',
      profilePictureUrl: data.profile_picture_url,
      followersCount: data.followers_count || 0,
      followsCount: data.follows_count || 0,
      mediaCount: data.media_count || 0,
    }
  } catch (error) {
    console.error('Erro ao conectar com a Graph API do Instagram:', error)
    return null
  }
}

/**
 * Busca mídias/publicações da conta do Instagram via Meta Graph API (SERVER-ONLY)
 */
export async function getInstagramMediaList(): Promise<InstagramMedia[]> {
  try {
    const { accountId, accessToken } = getInstagramCredentials()
    const url = `${INSTAGRAM_API_URL}/${accountId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&limit=25&access_token=${accessToken}`

    const res = await fetch(url, {
      method: 'GET',
      next: { revalidate: 120 }, // Cache por 2 minutos
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      console.error('Erro Meta Graph API (Media):', errorData)
      return []
    }

    const data = await res.json()
    const rawItems = (data.data || []) as Array<{
      id: string
      caption?: string
      media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
      media_url?: string
      permalink?: string
      timestamp: string
      like_count?: number
      comments_count?: number
    }>

    return rawItems.map((item) => ({
      id: item.id,
      caption: item.caption,
      mediaType: item.media_type,
      mediaUrl: item.media_url,
      permalink: item.permalink,
      timestamp: item.timestamp,
      likeCount: item.like_count || 0,
      commentsCount: item.comments_count || 0,
    }))
  } catch (error) {
    console.error('Erro ao buscar lista de mídias da Graph API:', error)
    return []
  }
}

/**
 * Busca conversas de Direct Messages (DM) via Meta Graph API (SERVER-ONLY)
 */
export async function getInstagramConversations(): Promise<InstagramConversation[]> {
  try {
    const { accountId, accessToken } = getInstagramCredentials()
    const url = `${INSTAGRAM_API_URL}/${accountId}/conversations?platform=instagram&fields=id,updated_time,unread_count,participants,messages{id,created_time,message,from}&limit=10&access_token=${accessToken}`

    const res = await fetch(url, {
      method: 'GET',
      next: { revalidate: 30 },
    })

    if (!res.ok) {
      return []
    }

    const data = await res.json()
    const rawData = (data.data || []) as Array<{
      id: string
      updated_time: string
      unread_count: number
      participants?: { data?: Array<{ id: string; username?: string; name?: string }> }
      messages?: { data?: Array<{ id: string; created_time: string; message: string; from: { id: string; username?: string } }> }
    }>

    return rawData.map((c) => ({
      id: c.id,
      updatedTime: c.updated_time,
      unreadCount: c.unread_count || 0,
      participants: c.participants?.data || [],
      messages: (c.messages?.data || []).map((m) => ({
        id: m.id,
        createdTime: m.created_time,
        message: m.message,
        from: m.from || { id: 'unknown' },
      })),
    }))
  } catch (error) {
    console.error('Erro ao buscar conversas DM do Instagram:', error)
    return []
  }
}

/**
 * Envia uma mensagem direta (DM) para um usuário do Instagram via Meta Graph API (SERVER-ONLY)
 */
export async function sendInstagramDirectMessage(recipientId: string, messageText: string) {
  try {
    const { accountId, accessToken } = getInstagramCredentials()
    const url = `${INSTAGRAM_API_URL}/${accountId}/messages`

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: messageText },
        access_token: accessToken,
      }),
    })

    const data = await res.json()
    if (!res.ok || !data.message_id) {
      throw new Error(data?.error?.message || 'Falha ao enviar Direct no Instagram.')
    }

    return { success: true, messageId: data.message_id }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro ao enviar DM.'
    throw new Error(msg)
  }
}

/**
 * Publica uma imagem no Feed do Instagram via Meta Graph API (SERVER-ONLY)
 */
export async function publishInstagramPost(options: { imageUrl: string; caption: string }) {
  try {
    const { accountId, accessToken } = getInstagramCredentials()

    // Passo 1: Criar o contêiner de mídia na Graph API
    const containerUrl = `${INSTAGRAM_API_URL}/${accountId}/media`
    const containerRes = await fetch(containerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: options.imageUrl,
        caption: options.caption,
        access_token: accessToken,
      }),
    })

    const containerData = await containerRes.json()
    if (!containerRes.ok || !containerData.id) {
      throw new Error(containerData?.error?.message || 'Falha ao criar o container da imagem no Instagram.')
    }

    const creationId = containerData.id

    // Passo 2: Publicar o contêiner criado
    const publishUrl = `${INSTAGRAM_API_URL}/${accountId}/media_publish`
    const publishRes = await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: accessToken,
      }),
    })

    const publishData = await publishRes.json()
    if (!publishRes.ok || !publishData.id) {
      throw new Error(publishData?.error?.message || 'Falha ao confirmar a publicação no Instagram.')
    }

    return { success: true, id: publishData.id }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro ao publicar no Instagram.'
    console.error('Erro na publicação Instagram Graph API:', msg)
    throw new Error(msg)
  }
}
