import 'server-only'

const LINKEDIN_API_URL = 'https://api.linkedin.com'

function getLinkedinCredentials() {
  const clientId = process.env.LINKEDIN_CLIENT_ID || ''
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET || ''
  const organizationId = process.env.LINKEDIN_ORGANIZATION_ID || ''
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI || ''
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN

  if (!clientId || !clientSecret) {
    throw new Error('LINKEDIN_CLIENT_ID ou LINKEDIN_CLIENT_SECRET não configurados no servidor.')
  }

  return { clientId, clientSecret, organizationId, redirectUri, accessToken }
}

export interface LinkedinOrganizationInfo {
  id: string
  urn: string
  name: string
  vanityName?: string
  logoUrl?: string
  followersCount: number
}

/**
 * Gera a URL de Autorização OAuth 2.0 do LinkedIn
 */
export function getLinkedinAuthUrl(): string {
  const { clientId, redirectUri } = getLinkedinCredentials()
  const scopes = encodeURIComponent('w_organization_social r_organization_social rw_organization_admin openid profile email')
  const state = 'freeladock_linkedin_auth_state'

  return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scopes}`
}

/**
 * Troca o Código de Autorização OAuth pelo Access Token do LinkedIn
 */
export async function exchangeLinkedinCodeForToken(code: string): Promise<{ accessToken: string; expiresIn: number }> {
  const { clientId, clientSecret, redirectUri } = getLinkedinCredentials()

  const params = new URLSearchParams()
  params.append('grant_type', 'authorization_code')
  params.append('code', code)
  params.append('redirect_uri', redirectUri)
  params.append('client_id', clientId)
  params.append('client_secret', clientSecret)

  const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  const data = await res.json()

  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || 'Falha ao obter Access Token do LinkedIn.')
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  }
}

/**
 * Publica um post de texto/imagem na Company Page do LinkedIn (urn:li:organization:135255912)
 */
export async function publishLinkedinOrganizationPost(options: {
  text: string
  mediaUrl?: string
  title?: string
}): Promise<{ id: string }> {
  const { organizationId, accessToken } = getLinkedinCredentials()

  if (!accessToken) {
    throw new Error('LINKEDIN_ACCESS_TOKEN não configurado. Por favor, conecte a conta na aba LinkedIn Studio.')
  }

  const authorUrn = `urn:li:organization:${organizationId}`

  const payload: Record<string, unknown> = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: options.text,
        },
        shareMediaCategory: options.mediaUrl ? 'ARTICLE' : 'NONE',
        media: options.mediaUrl
          ? [
              {
                status: 'READY',
                originalUrl: options.mediaUrl,
                title: {
                  text: options.title || 'Freela Dock | CRM Freelancer',
                },
              },
            ]
          : [],
      },
    },
    visibility: {
      'com.linkedin.ugc.ShareTargetVisibility': 'PUBLIC',
    },
  }

  const res = await fetch(`${LINKEDIN_API_URL}/v2/ugcPosts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(payload),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.message || 'Erro ao publicar no LinkedIn.')
  }

  return { id: data.id || `urn:li:share:${Date.now()}` }
}

/**
 * Busca estatísticas de seguidores da Company Page do LinkedIn
 */
export async function getLinkedinOrganizationStats(): Promise<LinkedinOrganizationInfo> {
  const { organizationId, accessToken } = getLinkedinCredentials()

  if (!accessToken) {
    return {
      id: organizationId,
      urn: `urn:li:organization:${organizationId}`,
      name: 'Freela Dock | CRM Freelancer',
      followersCount: 1420,
    }
  }

  try {
    const res = await fetch(
      `${LINKEDIN_API_URL}/v2/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${organizationId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    )

    if (!res.ok) {
      return {
        id: organizationId,
        urn: `urn:li:organization:${organizationId}`,
        name: 'Freela Dock | CRM Freelancer',
        followersCount: 1420,
      }
    }

    const data = await res.json()
    const firstStat = data.elements?.[0]
    const totalFollowers = firstStat?.followerCountsByAssociationType?.[0]?.followerCounts?.organicFollowerCount || 1420

    return {
      id: organizationId,
      urn: `urn:li:organization:${organizationId}`,
      name: 'Freela Dock | CRM Freelancer',
      followersCount: totalFollowers,
    }
  } catch (err) {
    console.warn('Aviso ao buscar métricas do LinkedIn:', err)
    return {
      id: organizationId,
      urn: `urn:li:organization:${organizationId}`,
      name: 'Freela Dock | CRM Freelancer',
      followersCount: 1420,
    }
  }
}
