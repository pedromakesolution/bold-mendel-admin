'use client'

import { useState } from 'react'
import {
  Mail,
  Zap,
  Plus,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { NewsletterItem } from '@/app/actions/social-media'
import NewsletterEditor from '@/components/social-media/NewsletterEditor'
import NewsletterList from '@/components/social-media/NewsletterList'
import AutomationManager from '@/components/social-media/AutomationManager'

interface BrevoEmailStudioProps {
  newsletters: NewsletterItem[]
  senders: Array<{ id: number; name: string; email: string }>
  lists: Array<{ id: number; name: string; totalSubscribers?: number; uniqueSubscribers?: number }>
  loading: boolean
  error: string | null
  onRefresh: () => void
}

export default function BrevoEmailStudio({
  newsletters,
  senders,
  lists,
  loading,
  error,
  onRefresh,
}: BrevoEmailStudioProps) {
  const [subTab, setSubTab] = useState<'newsletters' | 'automations'>('newsletters')
  const [isEditing, setIsEditing] = useState(false)
  const [selectedNewsletter, setSelectedNewsletter] = useState<NewsletterItem | null>(null)

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
    onRefresh()
  }

  return (
    <div className="space-y-6">
      {/* Sub-Navegação interna do E-Mail Mkt - Brevo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSubTab('newsletters')
              setIsEditing(false)
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              subTab === 'newsletters'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
            }`}
          >
            <Mail className="h-4 w-4" />
            Newsletters & Campanhas
          </button>

          <button
            onClick={() => {
              setSubTab('automations')
              setIsEditing(false)
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              subTab === 'automations'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
            }`}
          >
            <Zap className="h-4 w-4" />
            Automações Brevo
          </button>
        </div>

        {!isEditing && subTab === 'newsletters' && (
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Nova Newsletter
          </button>
        )}
      </div>

      {/* Conteúdo da Sub-aba Selecionada */}
      {subTab === 'newsletters' ? (
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
            Carregando newsletters da Brevo...
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
            onRefresh={onRefresh}
          />
        )
      ) : (
        <AutomationManager availableLists={lists} />
      )}
    </div>
  )
}
