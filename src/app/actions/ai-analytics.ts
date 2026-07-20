'use server'

import { createAdminClient } from '@/lib/supabase-admin'

export type AILog = {
  id: string
  user_id: string | null
  provider: string
  model: string | null
  prompt_tokens: number | null
  completion_tokens: number | null
  total_tokens: number | null
  cache_hit_tokens: number | null
  cache_miss_tokens: number | null
  estimated_cost: number | null
  status: string | null
  error_message: string | null
  created_at: string
}

export async function getAILogs(limit: number = 50) {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('ai_usage_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching AI logs:', error)
      return { success: false, data: null, error: error.message }
    }

    return { success: true, data: data as AILog[], error: null }
  } catch (err: any) {
    console.error('Exception fetching AI logs:', err)
    return { success: false, data: null, error: err.message }
  }
}

export async function getAIStats() {
  try {
    const supabase = createAdminClient()
    
    // Note: Since we might not have a direct aggregation in PostgREST for some complex math,
    // we can either fetch all (if small) or rely on a DB function. For this MVP, we fetch the 
    // last 1000 logs and aggregate them in memory, which is fine for dashboard purposes.
    const { data, error } = await supabase
      .from('ai_usage_logs')
      .select('prompt_tokens, completion_tokens, total_tokens, cache_hit_tokens, cache_miss_tokens, estimated_cost, provider, status')
      .order('created_at', { ascending: false })
      .limit(5000)

    if (error) {
      console.error('Error fetching AI stats:', error)
      return { success: false, data: null, error: error.message }
    }

    const logs = data || []
    
    let totalRequests = logs.length
    let totalTokens = 0
    let totalCost = 0
    let totalCacheHits = 0
    let totalCacheMisses = 0
    let successCount = 0
    let errorCount = 0

    logs.forEach(log => {
      totalTokens += log.total_tokens || 0
      totalCost += log.estimated_cost || 0
      totalCacheHits += log.cache_hit_tokens || 0
      totalCacheMisses += log.cache_miss_tokens || 0
      
      if (log.status === 'success') {
        successCount++
      } else if (log.status === 'error') {
        errorCount++
      }
    })

    const cacheHitRatio = totalCacheHits + totalCacheMisses > 0 
      ? (totalCacheHits / (totalCacheHits + totalCacheMisses)) * 100 
      : 0

    return { 
      success: true, 
      data: {
        totalRequests,
        totalTokens,
        totalCost,
        totalCacheHits,
        totalCacheMisses,
        cacheHitRatio,
        successCount,
        errorCount
      }, 
      error: null 
    }
  } catch (err: any) {
    console.error('Exception fetching AI stats:', err)
    return { success: false, data: null, error: err.message }
  }
}
