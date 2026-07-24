'use server'

import { createBlogAdminClient } from '@/lib/blog-admin-client'
import {
  KnowledgeBaseItem,
  AutoDMLogItem,
  gatekeeperCheck,
  retrieveInstagramRAGContext,
  queryDeepSeekForInstagramDM,
} from '@/lib/instagram-rag'
import { revalidatePath } from 'next/cache'

/**
 * Busca todas as diretrizes cadastradas na Base de Conhecimento RAG do Instagram
 */
export async function getKnowledgeBaseItemsAction() {
  try {
    const supabase = createBlogAdminClient()
    const { data, error } = await supabase
      .from('instagram_rag_knowledge_base')
      .select('*')
      .order('priority', { ascending: false })

    if (error) {
      if (error.code === '42P01') {
        return { items: [], notMigrated: true }
      }
      throw new Error(error.message)
    }

    return { items: (data || []) as KnowledgeBaseItem[], notMigrated: false }
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Erro ao buscar itens da base de conhecimento.'
    console.error('getKnowledgeBaseItemsAction error:', error)
    return { items: [], error, notMigrated: false }
  }
}

/**
 * Cadastra ou atualiza uma diretriz RAG no Supabase Blog
 */
export async function saveKnowledgeItemAction(item: {
  id?: string
  title: string
  category: 'pricing' | 'objections' | 'tone_of_voice' | 'features' | 'links' | 'faq'
  content: string
  triggerKeywords: string[]
  priority: number
  isActive: boolean
}) {
  try {
    const supabase = createBlogAdminClient()
    const payload = {
      title: item.title,
      category: item.category,
      content: item.content,
      trigger_keywords: item.triggerKeywords || [],
      priority: item.priority || 1,
      is_active: item.isActive,
      updated_at: new Date().toISOString(),
    }

    let savedItem
    if (item.id) {
      const { data, error } = await supabase
        .from('instagram_rag_knowledge_base')
        .update(payload)
        .eq('id', item.id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      savedItem = data
    } else {
      const { data, error } = await supabase
        .from('instagram_rag_knowledge_base')
        .insert([{ ...payload, created_at: new Date().toISOString() }])
        .select()
        .single()

      if (error) throw new Error(error.message)
      savedItem = data
    }

    revalidatePath('/social-media')
    return { success: true, item: savedItem as KnowledgeBaseItem }
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Erro ao salvar diretriz RAG.'
    return { success: false, error }
  }
}

/**
 * Exclui uma diretriz RAG do Supabase Blog
 */
export async function deleteKnowledgeItemAction(id: string) {
  try {
    const supabase = createBlogAdminClient()
    const { error } = await supabase.from('instagram_rag_knowledge_base').delete().eq('id', id)
    if (error) throw new Error(error.message)

    revalidatePath('/social-media')
    return { success: true }
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Erro ao excluir diretriz RAG.'
    return { success: false, error }
  }
}

/**
 * Ativa ou desativa uma diretriz RAG
 */
export async function toggleKnowledgeItemAction(id: string, isActive: boolean) {
  try {
    const supabase = createBlogAdminClient()
    const { error } = await supabase
      .from('instagram_rag_knowledge_base')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw new Error(error.message)

    revalidatePath('/social-media')
    return { success: true }
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Erro ao alterar status.'
    return { success: false, error }
  }
}

/**
 * Executa uma simulação em tempo real no Simulador do Admin
 */
export async function testRAGSimulationAction(messageText: string) {
  const startTime = Date.now()
  try {
    const staticReply = gatekeeperCheck(messageText)
    if (staticReply) {
      return {
        success: true,
        gatekeeperTriggered: true,
        aiReply: staticReply,
        retrievedContext: null,
        matchedItems: [],
        executionTimeMs: Date.now() - startTime,
        tokensUsed: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      }
    }

    const { contextText, matchedItems } = await retrieveInstagramRAGContext(messageText)
    const { text: aiReply, tokensUsed } = await queryDeepSeekForInstagramDM(messageText, contextText)

    return {
      success: true,
      gatekeeperTriggered: false,
      aiReply,
      retrievedContext: contextText,
      matchedItems,
      executionTimeMs: Date.now() - startTime,
      tokensUsed: tokensUsed || null,
    }
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Erro ao simular RAG com DeepSeek.'
    return { success: false, error, executionTimeMs: Date.now() - startTime }
  }
}

/**
 * Busca logs de auditoria recentes do Auto-DM no Supabase Blog
 */
export async function getAutoDMLogsAction() {
  try {
    const supabase = createBlogAdminClient()
    const { data, error } = await supabase
      .from('instagram_auto_dm_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error && error.code !== '42P01') {
      console.error('Erro ao buscar logs de Auto-DM:', error)
    }

    return { logs: (data || []) as AutoDMLogItem[] }
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Erro ao buscar logs.'
    return { logs: [], error }
  }
}
