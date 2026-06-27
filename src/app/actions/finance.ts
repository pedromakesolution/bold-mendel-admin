'use server'

import { requireAdminSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

/**
 * Triggers the calculate-financial-metrics Edge Function.
 * Protected by requireAdminSession() — cannot be called without a
 * valid admin session, unlike the previous inline Server Action
 * which relied solely on the layout guard.
 */
export async function recalculateMetrics() {
  await requireAdminSession()

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/calculate-financial-metrics`
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return { error: 'Variáveis de ambiente ausentes para o recálculo.' }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('[recalculateMetrics] Failed:', body)
    return { error: `Falha no recálculo: ${res.status}` }
  }

  revalidatePath('/finance')
  return { success: true }
}
