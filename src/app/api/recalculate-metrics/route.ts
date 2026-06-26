import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

/**
 * POST /api/recalculate-metrics
 * Manual trigger for the calculate-financial-metrics Edge Function.
 * Called by the "Recalcular Agora" button in the finance dashboard.
 *
 * Authorization: validates CRON_SECRET header to prevent abuse.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: 'Missing env vars' }, { status: 500 })
  }

  try {
    const res = await fetch(
      `${supabaseUrl}/functions/v1/calculate-financial-metrics`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!res.ok) {
      const body = await res.text()
      console.error('[recalculate-metrics] Edge Function error:', body)
      return Response.json({ error: body }, { status: res.status })
    }

    const data = await res.json()

    // Write audit log for manual recalculation
    const supabase = createAdminClient()
    await supabase.from('audit_logs').insert({
      admin_id: '00000000-0000-0000-0000-000000000000', // system
      action: 'change_plan', // closest available; extend enum if needed
      target_type: 'subscription',
      target_id: '00000000-0000-0000-0000-000000000000',
      payload: { type: 'manual_recalculate', result: data },
    })

    return Response.json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ error: message }, { status: 500 })
  }
}
