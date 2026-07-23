'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Share2,
  Mail,
  RefreshCw,
  LayoutDashboard,
} from 'lucide-react'
import { getNewslettersAction, NewsletterItem } from '@/app/actions/social-media'
import BrevoEmailStudio from '@/components/social-media/BrevoEmailStudio'
import InstagramStudio from '@/components/social-media/InstagramStudio'
import LinkedinStudio from '@/components/social-media/LinkedinStudio'
import ConsolidatedDashboard from '@/components/social-media/ConsolidatedDashboard'

function InstagramIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  )
}

function LinkedinIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
    </svg>
  )
}

export default function SocialMediaPage() {
  const [activeTab, setActiveTab] = useState<'email' | 'instagram' | 'linkedin' | 'dashboard'>('email')

  const [loading, setLoading] = useState(true)
  const [newsletters, setNewsletters] = useState<NewsletterItem[]>([])
  const [totalSubscribers, setTotalSubscribers] = useState(0)
  const [accountInfo, setAccountInfo] = useState<{ email?: string; plan?: Array<{ type?: string; credits?: number }> } | null>(null)
  const [senders, setSenders] = useState<Array<{ id: number; name: string; email: string }>>([])
  const [lists, setLists] = useState<Array<{ id: number; name: string; totalSubscribers?: number; uniqueSubscribers?: number }>>([])
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

  const emailCredits = accountInfo?.plan?.[0]?.credits ?? null

  return (
    <div className="space-y-6 p-2 sm:p-4">
      {/* Header Principal do Módulo Social Media */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 shadow-lg shadow-indigo-500/20">
              <Share2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Social Media</h1>
              <p className="text-xs text-zinc-400">
                Hub de gestão unificada: E-Mail Mkt (Brevo), Instagram e LinkedIn Freela Dock.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sincronizar Dados
          </button>
        </div>
      </div>

      {/* Navegação de Abas Principais */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab('email')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'email'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Mail className="h-4 w-4" />
          E-Mail Mkt - Brevo
        </button>

        <button
          onClick={() => setActiveTab('instagram')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'instagram'
              ? 'border-pink-500 text-pink-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <InstagramIcon className="h-4 w-4" />
          Instagram Studio
        </button>

        <button
          onClick={() => setActiveTab('linkedin')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'linkedin'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <LinkedinIcon className="h-4 w-4" />
          LinkedIn Freela Dock
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'dashboard'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          Painel Geral (Consolidado)
        </button>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'email' ? (
        <BrevoEmailStudio
          newsletters={newsletters}
          senders={senders}
          lists={lists}
          loading={loading}
          error={error}
          onRefresh={loadData}
        />
      ) : activeTab === 'instagram' ? (
        <InstagramStudio />
      ) : activeTab === 'linkedin' ? (
        <LinkedinStudio />
      ) : (
        <ConsolidatedDashboard
          totalSubscribers={totalSubscribers}
          emailCredits={emailCredits}
          newslettersCount={newsletters.length}
        />
      )}
    </div>
  )
}
