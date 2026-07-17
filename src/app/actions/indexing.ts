'use server'

import { requireAdminSession } from '@/lib/auth'
import { inspectUrl, requestIndexing } from '@/lib/google-search-console'
import { createBlogAdminClient } from '@/lib/blog-admin-client'
import { revalidatePath } from 'next/cache'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://freeladock.com.br'

export async function checkPostIndexStatus(postId: string, slug: string) {
  try {
    const session = await requireAdminSession()
    if (!session) return { error: 'Não autorizado.' }

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
    const session = await requireAdminSession()
    if (!session) return { error: 'Não autorizado.' }

    const url = `${SITE_URL}/blog/${slug}`
    const result = await requestIndexing(url, type)

    if (!result) {
      return { error: 'Falha ao solicitar indexação na API do Google.' }
    }

    const supabase = createBlogAdminClient()
    const { data: post } = await supabase
      .from('posts')
      .select('id')
      .eq('slug', slug)
      .single()

    if (post) {
      const nowStr = new Date().toISOString()
      await supabase
        .from('posts')
        .update({ google_index_requested_at: nowStr })
        .eq('id', post.id)

      await supabase
        .from('indexing_logs')
        .insert({ post_id: post.id, slug, requested_at: nowStr })
    }

    revalidatePath('/blog')
    return { success: true, result }
  } catch (error: any) {
    console.error('Error in submitPostToIndex:', error)
    return { error: error.message || 'Erro interno ao solicitar indexação.' }
  }
}

export async function submitBatchToIndex(slugs: string[], type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED') {
  try {
    const session = await requireAdminSession()
    if (!session) return { error: 'Não autorizado.' }

    const supabase = createBlogAdminClient()
    const { data: posts } = await supabase
      .from('posts')
      .select('id, slug')
      .in('slug', slugs)

    const results = await Promise.allSettled(
      slugs.map(async (slug) => {
        const res = await requestIndexing(`${SITE_URL}/blog/${slug}`, type)
        if (!res) throw new Error('Falha no Google API')

        const post = posts?.find(p => p.slug === slug)
        if (post) {
          const nowStr = new Date().toISOString()
          await supabase
            .from('posts')
            .update({ google_index_requested_at: nowStr })
            .eq('id', post.id)

          await supabase
            .from('indexing_logs')
            .insert({ post_id: post.id, slug, requested_at: nowStr })
        }
        return res
      })
    )

    revalidatePath('/blog')
    const successCount = results.filter(r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<any>).value).length
    return { success: true, count: successCount, total: slugs.length }
  } catch (error: any) {
    console.error('Error in submitBatchToIndex:', error)
    return { error: error.message || 'Erro interno ao solicitar indexação em lote.' }
  }
}

export async function checkBatchIndexStatus(items: { id: string, slug: string }[]) {
  try {
    const session = await requireAdminSession()
    if (!session) return { error: 'Não autorizado.' }

    const results = await Promise.allSettled(
      items.map(async (item) => {
        const url = `${SITE_URL}/blog/${item.slug}`
        const result = await inspectUrl(url)
        if (!result) throw new Error('Falha na API')

        const verdict = result.inspectionResult?.indexStatusResult?.verdict || 'UNKNOWN'

        const supabase = createBlogAdminClient()
        await supabase
          .from('posts')
          .update({
            google_index_status: verdict,
            google_index_checked_at: new Date().toISOString(),
          })
          .eq('id', item.id)

        return { id: item.id, verdict, data: result.inspectionResult?.indexStatusResult }
      })
    )

    revalidatePath('/blog')
    
    const fulfilled = results.filter(r => r.status === 'fulfilled').map(r => (r as PromiseFulfilledResult<any>).value)
    return { success: true, results: fulfilled }
  } catch (error: any) {
    console.error('Error in checkBatchIndexStatus:', error)
    return { error: error.message || 'Erro interno ao verificar indexação em lote.' }
  }
}

export async function getDailyIndexingCount() {
  try {
    const session = await requireAdminSession()
    if (!session) return 0

    const supabase = createBlogAdminClient()
    const today = new Date()
    // Define 00:00:00 da data atual no fuso horário UTC (ou local aproximado)
    today.setUTCHours(0, 0, 0, 0)

    const { count, error } = await supabase
      .from('indexing_logs')
      .select('id', { count: 'exact', head: true })
      .gte('requested_at', today.toISOString())

    if (error) throw error
    return count || 0
  } catch (error) {
    console.error('Error fetching daily indexing count:', error)
    return 0
  }
}
