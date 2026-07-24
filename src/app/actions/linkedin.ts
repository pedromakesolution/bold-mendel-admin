'use server'

import {
  getLinkedinAuthUrl,
  publishLinkedinOrganizationPost,
  getLinkedinOrganizationStats,
  LinkedinOrganizationInfo,
} from '@/lib/linkedin'
import { revalidatePath } from 'next/cache'

/**
 * Obtém a URL do fluxo de autorização OAuth 2.0 do LinkedIn
 */
export async function getLinkedinAuthUrlAction() {
  try {
    const authUrl = getLinkedinAuthUrl()
    return { success: true, authUrl }
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Erro ao gerar URL de autorização.'
    return { success: false, error }
  }
}

/**
 * Publica um post na Company Page do LinkedIn (urn:li:organization:135255912)
 */
export async function publishLinkedinPostAction(options: {
  text: string
  mediaUrl?: string
  title?: string
}) {
  try {
    const res = await publishLinkedinOrganizationPost(options)
    revalidatePath('/social-media')
    return { success: true, id: res.id, message: 'Publicação realizada no LinkedIn com sucesso!' }
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Erro ao publicar no LinkedIn.'
    return { success: false, error }
  }
}

/**
 * Busca estatísticas e métricas de desempenho da Company Page do Freela Dock no LinkedIn
 */
export async function getLinkedinStatsAction(): Promise<{
  success: boolean
  info?: LinkedinOrganizationInfo
  error?: string
}> {
  try {
    const info = await getLinkedinOrganizationStats()
    return { success: true, info }
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Erro ao buscar métricas do LinkedIn.'
    return { success: false, error }
  }
}
