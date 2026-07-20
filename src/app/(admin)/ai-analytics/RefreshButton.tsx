'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCcw } from 'lucide-react'

export function RefreshButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={isPending}
      className="flex items-center gap-2 rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <RefreshCcw className={`h-4 w-4 ${isPending ? 'animate-spin text-indigo-400' : ''}`} />
      {isPending ? 'Atualizando...' : 'Atualizar Dados'}
    </button>
  )
}
