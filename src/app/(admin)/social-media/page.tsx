'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Share2,
  Mail,
  Plus,
  Users,
  Send,
  Zap,
  Loader2,
  RefreshCw,
  Sparkles,
  Globe,
  MessageSquare,
  Smartphone,
  Flame,
} from 'lucide-react'
import { getNewslettersAction, NewsletterItem } from '@/app/actions/social-media'
import NewsletterEditor from '@/components/social-media/NewsletterEditor'
import NewsletterList from '@/components/social-media/NewsletterList'
import AutomationManager from '@/components/social-media/AutomationManager'
import SocialMediaStudio from '@/components/social-media/SocialMediaStudio'

export default function SocialMediaPage() {
  const [activeTab, setActiveTab] = useState<'newsletters' | 'automations' | 'social'>('newsletters')
  const [isEditing, setIsEditing] = useState(false)
  const [selectedNewsletter, setSelectedNewsletter] = useState<NewsletterItem | null>(null)

  const [loading, setLoading] = useState(true)
  const [newsletters, setNewsletters] = useState<NewsletterItem[]>([])
  const [totalSubscribers, setTotalSubscribers] = useState(0)
  const [accountInfo, setAccountInfo] = useState<{ email?: string; plan?: Array<{ type?: string; credits?: number }> } | null>(null)
  const [senders, setSenders] = useState<Array<{ id: number; name: string; email: string }>>([])
  const [lists, setLists] = useState<Array<{ id: number; name: string; totalSubscribers?: number }>>([])
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await getNewslettersAction()
    setLoading(false)

    if (res.error) {
      setError(res.error)
    } else {
      setNewsletters(res.newsletters)
      setTotalSubscribers(res.totalSubscribers)
      setAccountInfo(res.accountInfo)
      setSenders(res.senders || [])
      setLists(res.lists || [])
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  function handleCreateNew() {
    setSelectedNewsletter(null)
    setIsEditing(true)
  }

  function handleEdit(item: NewsletterItem) {
    setSelectedNewsletter(item)
    setIsEditing(true)
  }

  function handleSaved() {
    setIsEditing(false)
    setSelectedNewsletter(null)
    loadData()
  }

  const emailCredits = accountInfo?.plan?.[0]?.credits ?? null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/20">
              <Share2 className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-100">E-Mail Mkt - Brevo</h1>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Gerencie campanhas de newsletters, réguas de automação e contatos da Brevo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          {!isEditing && activeTab === 'newsletters' && (
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
            >
              <Plus className="h-4 w-4" />
              Nova Newsletter
            </button>
          )}
        </div>
      </div>

      {/* Cards de Visão Geral */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-400">Total de Inscritos (Brevo)</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-100">{totalSubscribers}</p>
          <p className="mt-1 text-[11px] text-zinc-500">Contatos ativos nas listas da Brevo</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-400">Saldo Brevo</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-100">
            {emailCredits !== null ? emailCredits.toLocaleString('pt-BR') : 'Ativo'}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">Créditos de e-mail disponíveis</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-400">Newsletters Criadas</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Send className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-100">{newsletters.length}</p>
          <p className="mt-1 text-[11px] text-zinc-500">Salvas no Supabase Blog</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-px">
        <button
          onClick={() => {
            setActiveTab('newsletters')
            setIsEditing(false)
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all ${
            activeTab === 'newsletters'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Mail className="h-4 w-4" />
          Newsletters (Brevo)
        </button>

        <button
          onClick={() => {
            setActiveTab('automations')
            setIsEditing(false)
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all ${
            activeTab === 'automations'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Zap className="h-4 w-4" />
          Automações Brevo
        </button>

        <button
          onClick={() => {
            setActiveTab('social')
            setIsEditing(false)
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all ${
            activeTab === 'social'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Share2 className="h-4 w-4" />
          Redes Sociais
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'newsletters' ? (
        isEditing ? (
          <NewsletterEditor
            initialNewsletter={selectedNewsletter}
            availableSenders={senders}
            availableLists={lists}
            onSaved={handleSaved}
            onCancel={() => setIsEditing(false)}
          />
        ) : loading ? (
          <div className="flex items-center justify-center py-20 text-zinc-400">
            <Loader2 className="h-6 w-6 animate-spin mr-2 text-indigo-400" />
            Carregando newsletters...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-center text-xs text-rose-300">
            <p className="font-semibold">{error}</p>
            <p className="mt-1 text-zinc-400">
              Certifique-se de executar o script <code className="bg-zinc-900 px-1 py-0.5 rounded text-zinc-200">newsletter_migration.sql</code> no Supabase do Blog.
            </p>
          </div>
        ) : (
          <NewsletterList
            newsletters={newsletters}
            onEdit={handleEdit}
            onRefresh={loadData}
          />
        )
      ) : activeTab === 'automations' ? (
        <AutomationManager availableLists={lists} />
      ) : (
        <SocialMediaStudio />
      )}
    </div>
  )
}
