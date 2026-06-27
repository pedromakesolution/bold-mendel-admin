'use client'

import { useTransition, useState } from 'react'
import { recalculateMetrics } from '@/app/actions/finance'
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

export default function RecalculateButton() {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null)

  function handleRecalculate() {
    setResult(null)
    startTransition(async () => {
      const res = await recalculateMetrics()
      setResult(res ?? { success: true })
      // Auto-clear success message after 5s
      if (!res?.error) {
        setTimeout(() => setResult(null), 5000)
      }
    })
  }

  return (
    <div className="flex items-center gap-3">
      {result?.error && (
        <span className="flex items-center gap-1.5 text-sm text-red-400">
          <AlertCircle className="h-4 w-4" />
          {result.error}
        </span>
      )}
      {result?.success && (
        <span className="flex items-center gap-1.5 text-sm text-emerald-400">
          <CheckCircle className="h-4 w-4" />
          Métricas recalculadas com sucesso
        </span>
      )}
      <button
        id="btn-recalculate-metrics"
        onClick={handleRecalculate}
        disabled={isPending}
        className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-700 disabled:opacity-50"
      >
        <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} aria-hidden="true" />
        {isPending ? 'Recalculando…' : 'Recalcular Agora'}
      </button>
    </div>
  )
}
