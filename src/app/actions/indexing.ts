'use server'

import { verifyAuth } from '@/lib/auth'
import { inspectUrl, requestIndexing } from '@/lib/google-search-console'
import { createBlogAdminClient } from '@/lib/blog-admin-client'
import { revalidatePath } from 'next/cache'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://freeladock.com.br'

export async function checkPostIndexStatus(postId: string, slug: string) {
  try {
    const user = await verifyAuth()
    if (!user) return { error: 'Não autorizado.' }

    const url = `${SITE_URL}/blog/${slug}`
    const result = await inspectUrl(url)

    if (!result) {
      return { error: 'Falha ao comunicar com a API do Google Search Console.' }
    }

    const verdict = result.inspectionResult?.indexStatusResult?.verdict || 'UNKNOWN'

    // Save to database
    const supabase = createBlogAdminClient()
    await supabase
      .from('posts')
      .update({
        google_index_status: verdict,
        google_index_checked_at: new Date().toISOString(),
      })
      .eq('id', postId)

    revalidatePath('/blog')
    revalidatePath(`/blog/${postId}/editar`)

    return { success: true, verdict, data: result.inspectionResult?.indexStatusResult }
  } catch (error: any) {
    console.error('Error in checkPostIndexStatus:', error)
    return { error: error.message || 'Erro interno ao verificar indexação.' }
  }
}

export async function submitPostToIndex(slug: string, type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED') {
  try {
    const user = await verifyAuth()
    if (!user) return { error: 'Não autorizado.' }

    const url = `${SITE_URL}/blog/${slug}`
    const result = await requestIndexing(url, type)

    if (!result) {
      return { error: 'Falha ao solicitar indexação na API do Google.' }
    }

    return { success: true, result }
  } catch (error: any) {
    console.error('Error in submitPostToIndex:', error)
    return { error: error.message || 'Erro interno ao solicitar indexação.' }
  }
}
