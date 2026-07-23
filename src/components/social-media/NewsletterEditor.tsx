'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Save,
  Send,
  Calendar,
  Clock,
  Eye,
  Edit3,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mail,
  User,
  Sparkles,
} from 'lucide-react'
import {
  saveNewsletterDraftAction,
  scheduleOrSendNewsletterAction,
  NewsletterItem,
} from '@/app/actions/social-media'
import { parseMarkdownToEmailHtml } from '@/lib/markdown-email'
import TestEmailModal from './TestEmailModal'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

interface NewsletterEditorProps {
  initialNewsletter?: NewsletterItem | null
  onSaved?: () => void
  onCancel?: () => void
}

export default function NewsletterEditor({
  initialNewsletter,
  onSaved,
  onCancel,
}: NewsletterEditorProps) {
  const [id, setId] = useState<string | undefined>(initialNewsletter?.id)
  const [title, setTitle] = useState(initialNewsletter?.title || '')
  const [subject, setSubject] = useState(initialNewsletter?.subject || '')
  const [senderName, setSenderName] = useState(
    initialNewsletter?.sender_name || 'Bold Mendel'
  )
  const [senderEmail, setSenderEmail] = useState(
    initialNewsletter?.sender_email || 'contato@freeladock.com.br'
  )
  const [contentMarkdown, setContentMarkdown] = useState(initialNewsletter?.content_markdown || '')

  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write')
  const [isScheduled, setIsScheduled] = useState(Boolean(initialNewsletter?.scheduled_at))
  const [scheduledAt, setScheduledAt] = useState(
    initialNewsletter?.scheduled_at
      ? new Date(initialNewsletter.scheduled_at).toISOString().slice(0, 16)
      : ''
  )

  const [loadingSave, setLoadingSave] = useState(false)
  const [loadingSend, setLoadingSend] = useState(false)
  const [isTestModalOpen, setIsTestModalOpen] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Converte Markdown completo para HTML inline-styled de e-mail (Brevo / Gmail / Outlook)
  const htmlContent = parseMarkdownToEmailHtml(contentMarkdown)

  async function handleSaveDraft() {
    if (!title.trim() || !subject.trim()) {
      setFeedback({ type: 'error', text: 'Preencha ao menos o Título Interno e o Assunto.' })
      return
    }

    setLoadingSave(true)
    setFeedback(null)

    const res = await saveNewsletterDraftAction({
      id,
      title,
      subject,
      senderName,
      senderEmail,
      contentMarkdown,
      contentHtml: htmlContent,
    })

    setLoadingSave(false)

    if (res.success && res.newsletter) {
      setId(res.newsletter.id)
      setFeedback({ type: 'success', text: 'Rascunho salvo com sucesso no Supabase!' })
      onSaved?.()
    } else {
      setFeedback({ type: 'error', text: res.error || 'Erro ao salvar rascunho.' })
    }
  }

  async function handleSendOrSchedule(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !subject.trim() || !contentMarkdown.trim()) {
      setFeedback({ type: 'error', text: 'Por favor, preencha todos os campos obrigatórios.' })
      return
    }

    let isoScheduledAt: string | undefined = undefined
    if (isScheduled) {
      if (!scheduledAt) {
        setFeedback({ type: 'error', text: 'Informe a data e hora do agendamento.' })
        return
      }
      isoScheduledAt = new Date(scheduledAt).toISOString()
    }

    setLoadingSend(true)
    setFeedback(null)

    const res = await scheduleOrSendNewsletterAction({
      id,
      title,
      subject,
      senderName,
      senderEmail,
      contentMarkdown,
      contentHtml: htmlContent,
      scheduledAt: isoScheduledAt,
    })

    setLoadingSend(false)

    if (res.success) {
      setFeedback({ type: 'success', text: res.message || 'Operação realizada com sucesso!' })
      onSaved?.()
    } else {
      setFeedback({ type: 'error', text: res.error || 'Falha ao processar envio.' })
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            {id ? 'Editar Newsletter' : 'Nova Newsletter'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Crie ou cole seu texto em Markdown. O sistema converte automaticamente para HTML formatado da Brevo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-zinc-700 px-3.5 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            >
              Voltar
            </button>
          )}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={loadingSave || loadingSend}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {loadingSave ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Salvar Rascunho
          </button>
          <button
            type="button"
            onClick={() => setIsTestModalOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-2 text-xs font-medium text-indigo-300 hover:bg-indigo-500/20 transition-colors"
          >
            <Mail className="h-3.5 w-3.5" />
            Enviar Teste
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`mt-4 flex items-start gap-2.5 rounded-lg p-3 text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <form onSubmit={handleSendOrSchedule} className="mt-6 space-y-5">
        {/* Metadados */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Título Interno (Identificação no Admin) *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Edição #42 - Lançamento da Nova Versão"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Assunto do E-mail (Subject do Leitor) *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="ex: 🚀 As novidades do Freela Dock chegaram!"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-zinc-400" />
              Nome do Remetente
            </label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-zinc-400" />
              E-mail do Remetente
            </label>
            <input
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Editor Markdown & Visualizador de E-mail */}
        <div>
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
            <label className="text-xs font-medium text-zinc-300">
              Conteúdo da Newsletter (Suporte total a Markdown) *
            </label>
            <div className="flex items-center gap-1 bg-zinc-800 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveTab('write')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  activeTab === 'write'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                Editor Markdown
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                Pré-visualização (E-mail Brevo)
              </button>
            </div>
          </div>

          {activeTab === 'write' ? (
            <div data-color-mode="dark" className="rounded-xl overflow-hidden border border-zinc-700">
              <MDEditor
                value={contentMarkdown}
                onChange={(val) => setContentMarkdown(val || '')}
                height={400}
                preview="live"
                hideToolbar={false}
              />
              <div className="bg-zinc-950 p-2.5 border-t border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
                <span>💡 Suporta marcações como: <code># Título</code>, <code>**Negrito**</code>, <code>[Link](url)</code>, <code>- Lista</code>, <code>&gt; Citação</code> e tabelas.</span>
                <span className="font-mono text-zinc-500">{contentMarkdown.length} caracteres</span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 min-h-[400px] overflow-hidden">
              <div className="mx-auto max-w-[640px] rounded-lg bg-white p-2 shadow-xl">
                <iframe
                  title="Pré-visualização do E-mail Brevo"
                  srcDoc={htmlContent}
                  className="w-full min-h-[450px] border-0 rounded"
                />
              </div>
            </div>
          )}
        </div>

        {/* Agendamento & Opções de Envio */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="scheduled-toggle"
                checked={isScheduled}
                onChange={(e) => setIsScheduled(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="scheduled-toggle" className="text-xs font-medium text-zinc-200 cursor-pointer flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-indigo-400" />
                Programar envio para data/hora específica
              </label>
            </div>
          </div>

          {isScheduled && (
            <div className="flex items-center gap-3 pt-2 animate-in fade-in duration-150">
              <div className="flex-1">
                <label className="block text-[11px] text-zinc-400 mb-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Data e Hora do Agendamento (Horário Local)
                </label>
                <input
                  type="datetime-local"
                  required={isScheduled}
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs text-zinc-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
          <button
            type="submit"
            disabled={loadingSend || loadingSave}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 transition-all"
          >
            {loadingSend ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : isScheduled ? (
              <>
                <Calendar className="h-4 w-4" />
                Programar Envio na Brevo
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Enviar Newsletter Agora
              </>
            )}
          </button>
        </div>
      </form>

      {/* Modal de envio de teste */}
      <TestEmailModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        newsletterData={{
          id,
          title,
          subject,
          senderName,
          senderEmail,
          contentHtml: htmlContent,
        }}
      />
    </div>
  )
}
