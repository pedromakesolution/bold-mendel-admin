'use client'

import { useTransition, useState } from 'react'
import {
  deactivateUser,
  reactivateUser,
  sendPasswordReset,
  changePlan,
  anonymizeUser,
  hardDeleteUser,
} from '@/app/actions/users'
import { useRouter } from 'next/navigation'
import { UserX, UserCheck, KeyRound, RefreshCw, Trash2, X, ShieldAlert } from 'lucide-react'

const PLANS = ['free', 'starter', 'pro', 'studio'] as const
type Plan = (typeof PLANS)[number]

// ── Toast ─────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error'
function Toast({
  message,
  type,
  onClose,
}: {
  message: string
  type: ToastType
  onClose: () => void
}) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={`flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
        type === 'success'
          ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700'
          : 'bg-red-900/80 text-red-300 border border-red-700'
      }`}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        aria-label="Fechar notificação"
        className="shrink-0 opacity-70 hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ── ConfirmDialog ─────────────────────────────────────────────────────────────
function ConfirmDialog({
  title,
  description,
  confirmLabel,
  confirmClassName,
  expectedInput,
  inputPlaceholder,
  onConfirm,
  onCancel,
}: {
  title: string
  description: string
  confirmLabel: string
  confirmClassName: string
  expectedInput?: string
  inputPlaceholder?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const [inputValue, setInputValue] = useState('')
  const isInputValid = !expectedInput || inputValue === expectedInput

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="mx-4 w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
        <h3 id="dialog-title" className="text-base font-semibold text-zinc-100">
          {title}
        </h3>
        <p className="mt-2 text-sm text-zinc-400">{description}</p>
        
        {expectedInput && (
          <div className="mt-4">
            <label className="mb-2 block text-sm text-zinc-400">
              Para confirmar, digite <span className="font-bold text-zinc-200">{expectedInput}</span> abaixo:
            </label>
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={inputPlaceholder}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
            />
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-700"
          >
            Cancelar
          </button>
          <button
            disabled={!isInputValid}
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${confirmClassName}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── UserActionButtons ─────────────────────────────────────────────────────────
export default function UserActionButtons({
  userId,
  userEmail,
  isActive,
  currentPlan,
}: {
  userId: string
  userEmail: string
  isActive: boolean
  currentPlan: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const [dialog, setDialog] = useState<{
    title: string
    description: string
    confirmLabel: string
    confirmClassName: string
    expectedInput?: string
    inputPlaceholder?: string
    onConfirm: () => void
  } | null>(null)

  function showToast(message: string, type: ToastType) {
    setToast({ message, type })
    setTimeout(() => setToast(null), 5000)
  }

  function openDialog(opts: typeof dialog) {
    setDialog(opts)
  }

  function closeDialog() {
    setDialog(null)
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleDeactivate() {
    openDialog({
      title: 'Desativar conta',
      description:
        'O acesso deste usuário será revogado imediatamente. O perfil e os dados são preservados. Esta ação pode ser revertida.',
      confirmLabel: 'Desativar',
      confirmClassName: 'bg-red-600 text-white hover:bg-red-500',
      onConfirm: () => {
        closeDialog()
        startTransition(async () => {
          await deactivateUser(userId)
          showToast('Conta desativada com sucesso.', 'success')
        })
      },
    })
  }

  function handleReactivate() {
    startTransition(async () => {
      await reactivateUser(userId)
      showToast('Conta reativada com sucesso.', 'success')
    })
  }

  function handlePasswordReset() {
    openDialog({
      title: 'Resetar senha',
      description: 'Um email de recuperação de senha será enviado ao usuário.',
      confirmLabel: 'Enviar email',
      confirmClassName: 'bg-indigo-600 text-white hover:bg-indigo-500',
      onConfirm: () => {
        closeDialog()
        startTransition(async () => {
          const result = await sendPasswordReset(userId)
          if (result?.error) {
            showToast(result.error, 'error')
          } else {
            showToast('Email de recuperação enviado com sucesso.', 'success')
          }
        })
      },
    })
  }

  function handleChangePlan(newPlan: Plan) {
    if (newPlan === currentPlan) return
    openDialog({
      title: 'Alterar plano',
      description: `Alterar plano de "${currentPlan}" para "${newPlan}"? Esta alteração é imediata e será registrada na auditoria.`,
      confirmLabel: `Alterar para ${newPlan.charAt(0).toUpperCase() + newPlan.slice(1)}`,
      confirmClassName: 'bg-indigo-600 text-white hover:bg-indigo-500',
      onConfirm: () => {
        closeDialog()
        startTransition(async () => {
          await changePlan(userId, newPlan)
          showToast(`Plano alterado para ${newPlan} com sucesso.`, 'success')
        })
      },
    })
  }

  function handleAnonymize() {
    openDialog({
      title: '⚠️ Anonimizar conta (LGPD)',
      description:
        'Esta ação é IRREVERSÍVEL. O nome, email, telefone e outros dados pessoais serão apagados permanentemente. O UUID e os dados financeiros/contratuais são mantidos para conformidade fiscal. O usuário perderá acesso permanentemente.',
      confirmLabel: 'Confirmo — Anonimizar dados pessoais',
      confirmClassName: 'bg-red-700 text-white hover:bg-red-600',
      onConfirm: () => {
        closeDialog()
        startTransition(async () => {
          const result = await anonymizeUser(userId)
          if (result?.error) {
            showToast(result.error, 'error')
          } else {
            showToast('Dados pessoais anonimizados com sucesso (LGPD).', 'success')
          }
        })
      },
    })
  }

  function handleHardDelete() {
    openDialog({
      title: '🚨 Excluir conta permanentemente (Hard Delete)',
      description:
        'Atenção extrema: esta ação apagará o usuário e todas as suas informações fisicamente do banco de dados de autenticação e da tabela profiles. A menos que hajam políticas de deleção em cascata (cascade), isso pode falhar caso haja contratos atrelados a ele. Esta ação NÃO tem volta.',
      confirmLabel: 'Sim, excluir totalmente',
      confirmClassName: 'bg-red-800 text-white hover:bg-red-700',
      expectedInput: userEmail,
      inputPlaceholder: 'Digite o email do usuário',
      onConfirm: () => {
        closeDialog()
        startTransition(async () => {
          const result = await hardDeleteUser(userId)
          if (result?.error) {
            showToast(result.error, 'error')
          } else {
            showToast('Usuário deletado permanentemente.', 'success')
            // Redirecionar para a lista de usuários pois o ID atual não existe mais
            setTimeout(() => {
              router.push('/users')
            }, 1500)
          }
        })
      },
    })
  }

  return (
    <>
      {/* Dialog modal */}
      {dialog && (
        <ConfirmDialog
          {...dialog}
          onCancel={closeDialog}
        />
      )}

      <div className="flex flex-col gap-4">
        {/* Toast notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

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

        {/* LGPD Anonymize — separated visually to reduce accidental clicks */}
        <div className="border-t border-zinc-800 pt-4">
          <p className="mb-3 text-xs text-zinc-600">
            Zona de perigo — ações irreversíveis
          </p>
          <button
            id="btn-anonymize-user"
            onClick={handleAnonymize}
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg border border-red-900 bg-red-950/20 px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-950/50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Anonimizar dados pessoais (LGPD)
          </button>
          
          <button
            id="btn-hard-delete-user"
            onClick={handleHardDelete}
            disabled={isPending}
            className="mt-3 flex items-center gap-2 rounded-lg border border-red-900 bg-red-950/40 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-950/70 disabled:opacity-50"
          >
            <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            Excluir conta permanentemente (Hard Delete)
          </button>
        </div>
      </div>
    </>
  )
}
