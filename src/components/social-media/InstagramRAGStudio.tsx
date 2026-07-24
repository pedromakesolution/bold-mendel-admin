'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Bot,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Search,
  Zap,
  Play,
  Clock,
  Database,
  Tag,
  BookOpen,
  Check,
  X,
  Layers,
  ShieldCheck,
  Cpu,
} from 'lucide-react'
import {
  getKnowledgeBaseItemsAction,
  saveKnowledgeItemAction,
  deleteKnowledgeItemAction,
  toggleKnowledgeItemAction,
  testRAGSimulationAction,
  getAutoDMLogsAction,
} from '@/app/actions/instagram-rag'
import { KnowledgeBaseItem, AutoDMLogItem } from '@/lib/instagram-rag'

const CATEGORY_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  pricing: { label: 'Preços & Planos', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  objections: { label: 'Objeções & Vendas', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  tone_of_voice: { label: 'Tom de Voz', bg: 'bg-purple-500/10', text: 'text-purple-400' },
  features: { label: 'Funcionalidades', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  links: { label: 'Links & CTAs', bg: 'bg-pink-500/10', text: 'text-pink-400' },
  faq: { label: 'Dúvidas Frequentes', bg: 'bg-zinc-500/10', text: 'text-zinc-300' },
}

export default function InstagramRAGStudio() {
  const [activeSubTab, setActiveSubTab] = useState<'knowledge' | 'simulator' | 'logs'>('knowledge')
  const [items, setItems] = useState<KnowledgeBaseItem[]>([])
  const [logs, setLogs] = useState<AutoDMLogItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [notMigrated, setNotMigrated] = useState<boolean>(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<'pricing' | 'objections' | 'tone_of_voice' | 'features' | 'links' | 'faq'>('pricing')
  const [content, setContent] = useState('')
  const [keywordsText, setKeywordsText] = useState('')
  const [priority, setPriority] = useState<number>(1)
  const [isActive, setIsActive] = useState(true)
  const [savingItem, setSavingItem] = useState(false)

  // Simulator State
  const [simMessage, setSimMessage] = useState('')
  const [simulating, setSimulating] = useState(false)
  const [simResult, setSimResult] = useState<{
    gatekeeperTriggered?: boolean
    aiReply?: string
    retrievedContext?: string | null
    matchedItems?: KnowledgeBaseItem[]
    executionTimeMs?: number
    tokensUsed?: Record<string, number> | null
    error?: string
  } | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [resKb, resLogs] = await Promise.all([
        getKnowledgeBaseItemsAction(),
        getAutoDMLogsAction(),
      ])

      if (resKb.notMigrated) {
        setNotMigrated(true)
      } else {
        setNotMigrated(false)
        setItems(resKb.items || [])
      }

      setLogs(resLogs.logs || [])
    } catch {
      setFeedback({ type: 'error', text: 'Erro ao carregar dados do RAG.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  function handleOpenCreateModal() {
    setEditingId(null)
    setTitle('')
    setCategory('pricing')
    setContent('')
    setKeywordsText('')
    setPriority(1)
    setIsActive(true)
    setIsModalOpen(true)
  }

  function handleOpenEditModal(item: KnowledgeBaseItem) {
    setEditingId(item.id)
    setTitle(item.title)
    setCategory(item.category)
    setContent(item.content)
    setKeywordsText((item.trigger_keywords || []).join(', '))
    setPriority(item.priority || 1)
    setIsActive(item.is_active)
    setIsModalOpen(true)
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      setFeedback({ type: 'error', text: 'Título e conteúdo são obrigatórios.' })
      return
    }

    setSavingItem(true)
    setFeedback(null)

    const triggerKeywords = keywordsText
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0)

    const res = await saveKnowledgeItemAction({
      id: editingId || undefined,
      title,
      category,
      content,
      triggerKeywords,
      priority: Number(priority),
      isActive,
    })

    setSavingItem(false)

    if (res.success) {
      setIsModalOpen(false)
      setFeedback({
        type: 'success',
        text: `Diretriz "${title}" ${editingId ? 'atualizada' : 'cadastrada'} com sucesso no Supabase Blog!`,
      })
      loadData()
    } else {
      setFeedback({ type: 'error', text: res.error || 'Erro ao salvar diretriz.' })
    }
  }

  async function handleDeleteItem(id: string, itemTitle: string) {
    if (!confirm(`Tem certeza que deseja excluir a diretriz "${itemTitle}"?`)) return

    const res = await deleteKnowledgeItemAction(id)
    if (res.success) {
      setFeedback({ type: 'success', text: `Diretriz "${itemTitle}" excluída.` })
      loadData()
    } else {
      setFeedback({ type: 'error', text: res.error || 'Erro ao excluir.' })
    }
  }

  async function handleToggleItem(id: string, currentActive: boolean) {
    const res = await toggleKnowledgeItemAction(id, !currentActive)
    if (res.success) {
      loadData()
    }
  }

  async function handleRunSimulation(e: React.FormEvent) {
    e.preventDefault()
    if (!simMessage.trim()) return

    setSimulating(true)
    setSimResult(null)

    const res = await testRAGSimulationAction(simMessage.trim())
    setSimulating(false)

    if (res.success) {
      setSimResult({
        gatekeeperTriggered: res.gatekeeperTriggered,
        aiReply: res.aiReply,
        retrievedContext: res.retrievedContext,
        matchedItems: (res.matchedItems as KnowledgeBaseItem[]) || [],
        executionTimeMs: res.executionTimeMs,
        tokensUsed: res.tokensUsed,
      })
    } else {
      setSimResult({ error: res.error || 'Erro na simulação.' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Status do Bot */}
      <div className="border-b border-zinc-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <Bot className="h-5 w-5 text-pink-400" />
            Auto-DM Bot Instagram Studio com RAG (DeepSeek & Supabase Blog)
          </h4>
          <p className="text-xs text-zinc-400 mt-0.5">
            Gerencie diretrizes de atendimento exclusivas para o Direct do Instagram com busca vetorial e otimização de tokens.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-pink-600/20 hover:from-pink-500 hover:to-purple-500"
          >
            <Plus className="h-4 w-4" />
            Nova Diretriz RAG
          </button>
        </div>
      </div>

      {/* Alerta de migração se a tabela ainda não existir no Supabase Blog */}
      {notMigrated && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-2 text-xs text-amber-200">
          <h5 className="font-bold flex items-center gap-2 text-amber-300">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
            Ação Necessária: Migração SQL no Supabase Blog
          </h5>
          <p className="leading-relaxed text-zinc-300">
            As tabelas do RAG ainda não foram criadas no seu banco de dados do <strong>Supabase Blog</strong>. Execute a migração localizada em:
          </p>
          <code className="block rounded-lg bg-zinc-900 p-2.5 font-mono text-[11px] text-amber-400 border border-amber-500/20">
            supabase/migrations/20260724_instagram_rag_blog_schema.sql
          </code>
        </div>
      )}

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

      {/* Sub-navegação interna */}
      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
        <button
          onClick={() => setActiveSubTab('knowledge')}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
            activeSubTab === 'knowledge'
              ? 'bg-pink-600 text-white shadow-md'
              : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Base de Conhecimento ({items.length})
        </button>

        <button
          onClick={() => setActiveSubTab('simulator')}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
            activeSubTab === 'simulator'
              ? 'bg-pink-600 text-white shadow-md'
              : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
          }`}
        >
          <Play className="h-4 w-4 text-emerald-400" />
          Simulador RAG / DeepSeek
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
            activeSubTab === 'logs'
              ? 'bg-pink-600 text-white shadow-md'
              : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
          }`}
        >
          <Clock className="h-4 w-4 text-purple-400" />
          Logs & Auditoria ({logs.length})
        </button>
      </div>

      {/* SUB-ABA 1: BASE DE CONHECIMENTO (KNOWLEDGE BASE) */}
      {activeSubTab === 'knowledge' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => {
              const catMeta = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.faq
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-5 space-y-3 transition-all ${
                    item.is_active
                      ? 'border-zinc-800 bg-zinc-900/80 shadow-lg hover:border-zinc-700'
                      : 'border-zinc-800/50 bg-zinc-950/40 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${catMeta.bg} ${catMeta.text}`}>
                      {catMeta.label}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleItem(item.id, item.is_active)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all ${
                          item.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {item.is_active ? 'Ativo' : 'Inativo'}
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                        title="Editar"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id, item.title)}
                        className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20"
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-bold text-zinc-100">{item.title}</h5>
                    <p className="text-xs text-zinc-300 mt-1 whitespace-pre-line leading-relaxed line-clamp-4">
                      {item.content}
                    </p>
                  </div>

                  {item.trigger_keywords && item.trigger_keywords.length > 0 && (
                    <div className="pt-2 border-t border-zinc-800/60 flex flex-wrap gap-1">
                      {item.trigger_keywords.map((kw, i) => (
                        <span key={i} className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400 font-mono">
                          #{kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {items.length === 0 && !loading && (
              <div className="col-span-full rounded-2xl border border-dashed border-zinc-800 p-8 text-center text-xs text-zinc-400 space-y-3">
                <BookOpen className="h-8 w-8 text-zinc-600 mx-auto" />
                <p>Nenhuma diretriz de atendimento RAG cadastrada no momento.</p>
                <button
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-pink-600 px-4 py-2 text-xs font-semibold text-white hover:bg-pink-500"
                >
                  <Plus className="h-4 w-4" /> Criar Primeira Diretriz
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-ABA 2: SIMULADOR / PLAYGROUND */}
      {activeSubTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleRunSimulation} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-4 shadow-xl">
            <h5 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Play className="h-4 w-4 text-emerald-400" />
              Simulador em Tempo Real
            </h5>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Simule a mensagem de um lead do Instagram para verificar quais diretrizes RAG são recuperadas e qual resposta o DeepSeek gerará.
            </p>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Mensagem do Lead (Instagram DM)</label>
              <textarea
                rows={4}
                value={simMessage}
                onChange={(e) => setSimMessage(e.target.value)}
                placeholder="Ex: Qual o valor do plano Pro do Freela Dock?"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3.5 text-xs text-zinc-100 focus:border-pink-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={simulating || !simMessage.trim()}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50"
              >
                {simulating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Processando RAG + DeepSeek...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" /> Executar Simulação
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Resultado da Simulação */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-4 shadow-xl flex flex-col justify-between">
            <div>
              <h5 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-purple-400" />
                Resultado da Execução RAG
              </h5>

              {simResult ? (
                <div className="mt-4 space-y-4 text-xs">
                  {simResult.error ? (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
                      {simResult.error}
                    </div>
                  ) : (
                    <>
                      {/* Gatekeeper Triggered Status */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                        <span className="font-semibold text-zinc-300">Gatekeeper (Roteador):</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            simResult.gatekeeperTriggered
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {simResult.gatekeeperTriggered ? 'Ativado (Resposta Estática 0 Tokens)' : 'Passou para RAG + IA'}
                        </span>
                      </div>

                      {/* Tempo de Resposta */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                        <span className="font-semibold text-zinc-300">Tempo de Resposta:</span>
                        <span className="font-mono text-emerald-400">{simResult.executionTimeMs} ms</span>
                      </div>

                      {/* Trechos RAG Injetados */}
                      {simResult.retrievedContext && (
                        <div>
                          <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                            Contexto RAG Recuperado do Supabase Blog:
                          </label>
                          <pre className="rounded-xl bg-zinc-900 p-3 text-[11px] text-zinc-300 font-mono whitespace-pre-wrap border border-zinc-800 max-h-40 overflow-y-auto">
                            {simResult.retrievedContext}
                          </pre>
                        </div>
                      )}

                      {/* Resposta Final Gerada */}
                      <div>
                        <label className="block text-[11px] font-bold text-pink-400 mb-1">
                          Resposta Final Gerada para o Direct:
                        </label>
                        <div className="rounded-xl bg-pink-950/30 border border-pink-500/30 p-4 text-zinc-100 leading-relaxed font-sans">
                          {simResult.aiReply}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="mt-8 text-center text-xs text-zinc-500 space-y-2 py-8">
                  <Sparkles className="h-8 w-8 text-zinc-700 mx-auto" />
                  <p>Digite uma pergunta ao lado e clique em "Executar Simulação".</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-ABA 3: LOGS & AUDITORIA */}
      {activeSubTab === 'logs' && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-4 shadow-xl">
          <h5 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-400" />
            Histórico de DMs Respondidas
          </h5>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-800 text-[11px] font-semibold text-zinc-400">
                <tr>
                  <th className="py-2.5 px-3">Data/Hora</th>
                  <th className="py-2.5 px-3">Lead (Sender ID)</th>
                  <th className="py-2.5 px-3">Mensagem do Lead</th>
                  <th className="py-2.5 px-3">Status RAG</th>
                  <th className="py-2.5 px-3">Resposta Enviada</th>
                  <th className="py-2.5 px-3">Tempo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-800/30 transition-all">
                    <td className="py-3 px-3 font-mono text-[10px] text-zinc-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-3 font-mono text-[10px] text-pink-400">{log.sender_id}</td>
                    <td className="py-3 px-3 max-w-xs truncate">{log.user_message}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          log.gatekeeper_triggered ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {log.gatekeeper_triggered ? 'Gatekeeper' : 'RAG + DeepSeek'}
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-sm truncate text-zinc-200">{log.ai_response}</td>
                    <td className="py-3 px-3 font-mono text-[10px] text-emerald-400">{log.execution_time_ms}ms</td>
                  </tr>
                ))}

                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500">
                      Nenhum log de resposta automática registrado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Criação/Edição de Diretriz RAG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleSaveItem}
            className="w-full max-w-lg rounded-2xl border border-pink-500/30 bg-zinc-900 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-pink-400" />
                {editingId ? 'Editar Diretriz RAG' : 'Nova Diretriz de Atendimento RAG'}
              </h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Título da Diretriz *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Política de Descontos e Preço Pro"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-100 focus:border-pink-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Categoria *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-100 focus:border-pink-500 focus:outline-none"
                >
                  <option value="pricing">Preços & Planos</option>
                  <option value="objections">Objeções & Vendas</option>
                  <option value="tone_of_voice">Tom de Voz</option>
                  <option value="features">Funcionalidades</option>
                  <option value="links">Links & CTAs</option>
                  <option value="faq">Dúvidas Frequentes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Prioridade (1 a 10)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-100 focus:border-pink-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Orientações de Resposta para a IA (Conteúdo RAG) *
              </label>
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Ex: • O plano Pro custa R$ 29,90/mês. • Não oferecemos descontos adicionais no Direct."
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3.5 text-xs text-zinc-100 focus:border-pink-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Palavras-chave Gatilho (Separe por vírgula)</label>
              <input
                type="text"
                value={keywordsText}
                onChange={(e) => setKeywordsText(e.target.value)}
                placeholder="preço, valor, plano, desconto, mensalidade"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-100 focus:border-pink-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="is_active_cb"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-950 text-pink-600 focus:ring-pink-500"
              />
              <label htmlFor="is_active_cb" className="text-xs text-zinc-300">
                Diretriz ativa para recuperação pelo RAG
              </label>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingItem}
                className="flex items-center gap-1.5 rounded-xl bg-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-pink-500 disabled:opacity-50"
              >
                {savingItem ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Salvar Diretriz
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
