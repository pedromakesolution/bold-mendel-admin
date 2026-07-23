'use client'

import { useState } from 'react'
import { Send, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { sendTestNewsletterAction } from '@/app/actions/social-media'

interface TestEmailModalProps {
  isOpen: boolean
  onClose: () => void
  newsletterData: {
    id?: string
    title: string
    subject: string
    senderName: string
    senderEmail: string
    contentHtml: string
  }
}

export default function TestEmailModal({ isOpen, onClose, newsletterData }: TestEmailModalProps) {
  const [testEmail, setTestEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  if (!isOpen) return null

  async function handleSendTest(e: React.FormEvent) {
    e.preventDefault()
    if (!testEmail || !testEmail.includes('@')) {
      setStatusMsg({ type: 'error', text: 'Por favor, informe um e-mail válido.' })
      return
    }

    setLoading(true)
    setStatusMsg(null)

    const res = await sendTestNewsletterAction({
      ...newsletterData,
      testEmail,
    })

    setLoading(false)

    if (res.success) {
      setStatusMsg({ type: 'success', text: res.message || 'E-mail de teste enviado!' })
    } else {
      setStatusMsg({ type: 'error', text: res.error || 'Falha ao enviar e-mail de teste.' })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-indigo-400" />
            <h3 className="text-lg font-semibold text-zinc-100">Enviar E-mail de Teste</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSendTest} className="mt-4 space-y-4">
          <p className="text-xs text-zinc-400">
            Envia uma prévia real da newsletter com o assunto <strong>"{newsletterData.subject || 'Sem assunto'}"</strong> para o seu e-mail de teste.
          </p>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              E-mail de Destino do Teste
            </label>
            <input
              type="email"
              required
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="seu-email@exemplo.com.br"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          {statusMsg && (
            <div
              className={`flex items-start gap-2.5 rounded-lg p-3 text-xs ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Enviar Teste
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
