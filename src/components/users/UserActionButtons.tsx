'use client'

import { useTransition } from 'react'
import { deactivateUser, reactivateUser, sendPasswordReset, changePlan } from '@/app/actions/users'
import { UserX, UserCheck, KeyRound, RefreshCw } from 'lucide-react'

const PLANS = ['free', 'starter', 'pro', 'studio'] as const
type Plan = (typeof PLANS)[number]

export default function UserActionButtons({
  userId,
  isActive,
  currentPlan,
}: {
  userId: string
  isActive: boolean
  currentPlan: string
}) {
  const [isPending, startTransition] = useTransition()

  function handleDeactivate() {
    if (!confirm('Tem certeza que deseja desativar este usuário? O acesso será revogado imediatamente.')) return
    startTransition(() => { void deactivateUser(userId) })
  }

  function handleReactivate() {
    startTransition(() => { void reactivateUser(userId) })
  }

  function handlePasswordReset() {
    if (!confirm('Enviar email de recuperação de senha para este usuário?')) return
    startTransition(async () => {
      const result = await sendPasswordReset(userId)
      if (result?.error) alert(result.error)
      else alert('Email de recuperação enviado com sucesso.')
    })
  }

  function handleChangePlan(newPlan: Plan) {
    if (newPlan === currentPlan) return
    if (!confirm(`Alterar plano para "${newPlan}"?`)) return
    startTransition(() => { void changePlan(userId, newPlan) })
  }

  return (
    <div className="flex flex-wrap gap-3">
      {/* Activate / Deactivate */}
      {isActive ? (
        <button
          id="btn-deactivate-user"
          onClick={handleDeactivate}
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg border border-red-800 bg-red-950/30 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-950/60 disabled:opacity-50"
        >
          <UserX className="h-4 w-4" aria-hidden="true" />
          Desativar conta
        </button>
      ) : (
        <button
          id="btn-reactivate-user"
          onClick={handleReactivate}
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg border border-emerald-800 bg-emerald-950/30 px-4 py-2 text-sm font-medium text-emerald-400 transition hover:bg-emerald-950/60 disabled:opacity-50"
        >
          <UserCheck className="h-4 w-4" aria-hidden="true" />
          Reativar conta
        </button>
      )}

      {/* Password reset */}
      <button
        id="btn-reset-password"
        onClick={handlePasswordReset}
        disabled={isPending}
        className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-700 disabled:opacity-50"
      >
        <KeyRound className="h-4 w-4" aria-hidden="true" />
        Resetar senha
      </button>

      {/* Change plan */}
      <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2">
        <RefreshCw className="h-4 w-4 text-zinc-500" aria-hidden="true" />
        <span className="text-sm text-zinc-400">Plano:</span>
        <select
          id="select-change-plan"
          value={currentPlan}
          disabled={isPending}
          onChange={(e) => handleChangePlan(e.target.value as Plan)}
          className="bg-transparent text-sm font-medium text-zinc-100 outline-none cursor-pointer disabled:opacity-50"
          aria-label="Alterar plano do usuário"
        >
          {PLANS.map((p) => (
            <option key={p} value={p} className="bg-zinc-800">
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {isPending && (
        <span className="flex items-center gap-2 text-sm text-zinc-500">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Processando...
        </span>
      )}
    </div>
  )
}
