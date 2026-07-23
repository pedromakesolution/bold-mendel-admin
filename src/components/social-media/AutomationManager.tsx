'use client'

import { useState } from 'react'
import {
  Zap,
  Play,
  UserPlus,
  UserMinus,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Code,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react'
import {
  triggerBrevoAutomationEventAction,
  manageBrevoContactListAction,
  sendBrevoTransactionalTemplateAction,
} from '@/app/actions/social-media'

interface AutomationManagerProps {
  availableLists?: Array<{ id: number; name: string; totalSubscribers?: number }>
}

export default function AutomationManager({ availableLists = [] }: AutomationManagerProps) {
  const [activeSection, setActiveSection] = useState<'events' | 'lists' | 'transactional'>('events')

  // Disparo de Eventos
  const [eventEmail, setEventEmail] = useState('')
  const [eventName, setEventName] = useState('cadastro_landing_page')
  const [eventParamsJson, setEventParamsJson] = useState('{\n  "origem": "landing_page",\n  "plano": "freelancer"\n}')
  const [loadingEvent, setLoadingEvent] = useState(false)

  // Gerenciador de Listas
  const [listEmail, setListEmail] = useState('')
  const [selectedListId, setSelectedListId] = useState<number>(availableLists[0]?.id || 3)
  const [loadingListAction, setLoadingListAction] = useState(false)

  // E-mail Transacional por Template ID
  const [transacEmail, setTransacEmail] = useState('')
  const [templateId, setTemplateId] = useState<number>(1)
  const [transacParamsJson, setTransacParamsJson] = useState('{\n  "FIRSTNAME": "Pedro",\n  "PROPOSAL_URL": "https://freeladock.com.br/proposta/123"\n}')
  const [loadingTransac, setLoadingTransac] = useState(false)

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleTriggerEvent(e: React.FormEvent) {
    e.preventDefault()
    if (!eventEmail || !eventName) {
      setFeedback({ type: 'error', text: 'Preencha o e-mail e o nome do evento.' })
      return
    }

    setLoadingEvent(true)
    setFeedback(null)

    const res = await triggerBrevoAutomationEventAction(eventEmail, eventName, eventParamsJson)
    setLoadingEvent(false)

    if (res.success) {
      setFeedback({ type: 'success', text: res.message || 'Evento disparado com sucesso!' })
    } else {
      setFeedback({ type: 'error', text: res.error || 'Erro ao disparar evento.' })
    }
  }

  async function handleListAction(action: 'add' | 'remove') {
    if (!listEmail) {
      setFeedback({ type: 'error', text: 'Informe o e-mail do contato.' })
      return
    }

    setLoadingListAction(true)
    setFeedback(null)

    const res = await manageBrevoContactListAction(listEmail, selectedListId, action)
    setLoadingListAction(false)

    if (res.success) {
      setFeedback({ type: 'success', text: res.message || 'Ação na lista concluída!' })
    } else {
      setFeedback({ type: 'error', text: res.error || 'Erro ao gerenciar contato na lista.' })
    }
  }

  async function handleSendTransactional(e: React.FormEvent) {
    e.preventDefault()
    if (!transacEmail || !templateId) {
      setFeedback({ type: 'error', text: 'Preencha o e-mail e o ID do template.' })
      return
    }

    setLoadingTransac(true)
    setFeedback(null)

    const res = await sendBrevoTransactionalTemplateAction(transacEmail, Number(templateId), transacParamsJson)
    setLoadingTransac(false)

    if (res.success) {
      setFeedback({ type: 'success', text: res.message || 'E-mail transacional enviado!' })
    } else {
      setFeedback({ type: 'error', text: res.error || 'Erro ao enviar e-mail transacional.' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Box Explicativo de Arquitetura de Automação */}
      <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-zinc-900 to-purple-950/30 p-6 shadow-xl backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Zap className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-xs">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              Automações & Marketing Automation Brevo
            </h3>
            <p className="text-zinc-300 leading-relaxed">
              O fluxo de automação é desenhado visualmente na Brevo. Através desta interface no Admin, você gerencia e testa o acionamento de eventos, réguas de e-mails e movimentação de contatos via API REST em tempo real.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1 bg-zinc-800/80 px-2.5 py-1 rounded-md border border-zinc-700">
                1. Desenhe o Workflow na Brevo
              </span>
              <ArrowRight className="h-3 w-3 text-zinc-600" />
              <span className="flex items-center gap-1 bg-indigo-950 px-2.5 py-1 rounded-md border border-indigo-800 text-indigo-300">
                2. Dispare Eventos / Listas via API
              </span>
              <ArrowRight className="h-3 w-3 text-zinc-600" />
              <span className="flex items-center gap-1 bg-emerald-950 px-2.5 py-1 rounded-md border border-emerald-800 text-emerald-300">
                3. Régua Automática Executada
              </span>
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`flex items-start gap-2.5 rounded-xl p-4 text-xs ${
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

      {/* Seletor de Ferramenta */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setActiveSection('events')}
          className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
            activeSection === 'events'
              ? 'border-indigo-500 bg-indigo-500/10 text-zinc-100 shadow-md'
              : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
          }`}
        >
          <Play className="h-5 w-5 text-indigo-400" />
          <div>
            <p className="text-xs font-bold">Eventos Customizados</p>
            <p className="text-[11px] text-zinc-500">Track events (`POST /events`)</p>
          </div>
        </button>

        <button
          onClick={() => setActiveSection('lists')}
          className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
            activeSection === 'lists'
              ? 'border-indigo-500 bg-indigo-500/10 text-zinc-100 shadow-md'
              : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
          }`}
        >
          <Layers className="h-5 w-5 text-purple-400" />
          <div>
            <p className="text-xs font-bold">Gatilhos de Lista</p>
            <p className="text-[11px] text-zinc-500">Entrada/Saída de Workflows</p>
          </div>
        </button>

        <button
          onClick={() => setActiveSection('transactional')}
          className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
            activeSection === 'transactional'
              ? 'border-indigo-500 bg-indigo-500/10 text-zinc-100 shadow-md'
              : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
          }`}
        >
          <Mail className="h-5 w-5 text-emerald-400" />
          <div>
            <p className="text-xs font-bold">Templates Transacionais</p>
            <p className="text-[11px] text-zinc-500">Disparo SMTP via Template ID</p>
          </div>
        </button>
      </div>

      {/* Conteúdo da Ferramenta Selecionada */}
      {activeSection === 'events' && (
        <form onSubmit={handleTriggerEvent} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-4 shadow-xl">
          <div className="border-b border-zinc-800 pb-3">
            <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Play className="h-4 w-4 text-indigo-400" />
              Disparar Evento Customizado (Track Event)
            </h4>
            <p className="text-xs text-zinc-400 mt-1">
              Envia um sinal em tempo real para a Brevo ativar os workflows que escutam este evento.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">E-mail do Contato *</label>
              <input
                type="email"
                required
                value={eventEmail}
                onChange={(e) => setEventEmail(e.target.value)}
                placeholder="cliente@exemplo.com.br"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Nome do Evento na Brevo *</label>
              <input
                type="text"
                required
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="ex: cadastro_landing_page, proposta_solicitada"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs text-zinc-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Code className="h-3.5 w-3.5 text-zinc-400" /> Atributos/Parâmetros em JSON (opcional)
              </span>
            </label>
            <textarea
              rows={4}
              value={eventParamsJson}
              onChange={(e) => setEventParamsJson(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 font-mono text-xs text-zinc-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={loadingEvent}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50 transition-all"
            >
              {loadingEvent ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Disparar Evento na Brevo
            </button>
          </div>
        </form>
      )}

      {activeSection === 'lists' && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-4 shadow-xl">
          <div className="border-b border-zinc-800 pb-3">
            <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-400" />
              Gatilhos por Entrada/Saída de Lista
            </h4>
            <p className="text-xs text-zinc-400 mt-1">
              Adicione ou remova um contato de uma lista da Brevo para disparar ou pausar réguas de e-mails automáticas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">E-mail do Contato *</label>
              <input
                type="email"
                required
                value={listEmail}
                onChange={(e) => setListEmail(e.target.value)}
                placeholder="cliente@exemplo.com.br"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs text-zinc-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Lista Alvo na Brevo *</label>
              <select
                value={selectedListId}
                onChange={(e) => setSelectedListId(Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs text-zinc-100 focus:border-indigo-500 focus:outline-none"
              >
                {availableLists.map((l) => (
                  <option key={l.id} value={l.id}>
                    Lista #{l.id} - {l.name} {l.totalSubscribers !== undefined ? `(${l.totalSubscribers} contatos)` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleListAction('remove')}
              disabled={loadingListAction}
              className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 disabled:opacity-50 transition-colors"
            >
              {loadingListAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
              Remover da Lista
            </button>
            <button
              type="button"
              onClick={() => handleListAction('add')}
              disabled={loadingListAction}
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-600/20 hover:bg-purple-500 disabled:opacity-50 transition-all"
            >
              {loadingListAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Adicionar à Lista (Ativar Workflow)
            </button>
          </div>
        </div>
      )}

      {activeSection === 'transactional' && (
        <form onSubmit={handleSendTransactional} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-4 shadow-xl">
          <div className="border-b border-zinc-800 pb-3">
            <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Mail className="h-4 w-4 text-emerald-400" />
              Disparar Template Transacional (SMTP)
            </h4>
            <p className="text-xs text-zinc-400 mt-1">
              Envia um e-mail individual baseado em um Template ID configurado na Brevo com dados dinâmicos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">E-mail do Destinatário *</label>
              <input
                type="email"
                required
                value={transacEmail}
                onChange={(e) => setTransacEmail(e.target.value)}
                placeholder="cliente@exemplo.com.br"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs text-zinc-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">ID do Template na Brevo *</label>
              <input
                type="number"
                required
                value={templateId}
                onChange={(e) => setTemplateId(Number(e.target.value))}
                placeholder="ex: 1, 2, 12"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs text-zinc-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Code className="h-3.5 w-3.5 text-zinc-400" /> Parâmetros Dinâmicos em JSON (params)
              </span>
            </label>
            <textarea
              rows={4}
              value={transacParamsJson}
              onChange={(e) => setTransacParamsJson(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 font-mono text-xs text-zinc-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={loadingTransac}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-50 transition-all"
            >
              {loadingTransac ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Enviar E-mail Transacional
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
