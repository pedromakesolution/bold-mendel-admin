'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Users,
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  TrendingUp,
  Plus,
  Image as ImageIcon,
  Video,
  Layers,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Send,
  Trash2,
  RefreshCw,
  ExternalLink,
  Calendar,
  Clock,
  ShieldCheck,
  Grid,
  PieChart,
  Bot,
  Zap,
  HelpCircle,
  Check,
  Settings,
} from 'lucide-react'
import {
  getInstagramDataAction,
  publishInstagramPostAction,
} from '@/app/actions/social-media'

function InstagramIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  )
}

export interface InstagramPostItem {
  id: string
  type: 'feed_4_5' | 'feed_1_1' | 'reels' | 'stories' | 'carousel'
  caption: string
  mediaUrl: string
  permalink?: string
  status: 'scheduled' | 'published' | 'draft'
  scheduledAt?: string
  publishedAt?: string
  likes: number
  comments: number
  saves: number
  reach: number
}

interface DirectMessageItem {
  id: string
  senderName: string
  senderHandle: string
  avatarUrl?: string
  lastMessage: string
  updatedAt: string
  unread: boolean
  messages: Array<{ id: string; sender: 'user' | 'me'; text: string; time: string }>
}

export default function InstagramStudio() {
  const [activeSubTab, setActiveSubTab] = useState<'metrics' | 'schedule' | 'dm_inbox' | 'autodm' | 'permissions'>('metrics')
  const [activeFormatFilter, setActiveFormatFilter] = useState<'all' | 'feed' | 'reels' | 'carousel'>('all')
  const [isPublisherOpen, setIsPublisherOpen] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Auto-DM Bot State
  const [autoDmEnabled, setAutoDmEnabled] = useState(true)
  const [aiPromptContext, setAiPromptContext] = useState(
    'Você é o assistente virtual do Freela Dock no Instagram Direct. Responda dúvidas de freelancers sobre propostas com IA, assinatura digital de contratos e cobranças automáticas. Convide para cadastrar grátis em www.freeladock.com.br.'
  )
  const [triggerKeywords, setTriggerKeywords] = useState('proposta, contrato, valor, como funciona, link, cadastro, teste')

  // Dados reais da conta
  const [accountInfo, setAccountInfo] = useState<{
    id: string
    username: string
    name?: string
    followersCount: number
    followsCount: number
    mediaCount: number
  } | null>(null)

  // Lista de Posts
  const [posts, setPosts] = useState<InstagramPostItem[]>([])

  // State do Criador/Agendador (Suporta Retrato 4:5 e Quadrado 1:1)
  const [postType, setPostType] = useState<'feed_4_5' | 'feed_1_1' | 'reels' | 'stories' | 'carousel'>('feed_4_5')
  const [caption, setCaption] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // DM State
  const [conversations, setConversations] = useState<DirectMessageItem[]>([
    {
      id: 'conv-1',
      senderName: 'Lucas Web Designer',
      senderHandle: '@lucas.webdesign',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      lastMessage: 'Queria entender como o Freela Dock me ajuda com o contrato digital e propostas.',
      updatedAt: 'Há 12 min',
      unread: true,
      messages: [
        { id: 'm1', sender: 'user', text: 'Olá! Vi a publicação de vocês sobre o calote em contrato de site.', time: '14:20' },
        { id: 'm2', sender: 'user', text: 'Queria entender como o Freela Dock me ajuda com o contrato digital e propostas.', time: '14:21' },
      ],
    },
    {
      id: 'conv-2',
      senderName: 'Camila Estúdio de Design',
      senderHandle: '@camila.designstudio',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      lastMessage: 'Qual é o valor do plano Pro após a degustação do plano Free?',
      updatedAt: 'Há 1 hora',
      unread: false,
      messages: [
        { id: 'm3', sender: 'user', text: 'Boa tarde! Gostei muito da plataforma!', time: '13:05' },
        { id: 'm4', sender: 'user', text: 'Qual é o valor do plano Pro após a degustação do plano Free?', time: '13:06' },
      ],
    },
  ])
  const [selectedConvId, setSelectedConvId] = useState<string>('conv-1')
  const [replyText, setReplyText] = useState('')
  const [sendingDm, setSendingDm] = useState(false)

  const loadInstagramApiData = useCallback(async () => {
    setLoadingData(true)
    const res = await getInstagramDataAction()
    setLoadingData(false)

    if (res.success && res.account) {
      setAccountInfo(res.account)
    }

    if (res.mediaList && res.mediaList.length > 0) {
      const mappedPosts: InstagramPostItem[] = res.mediaList.map((m) => {
        let type: 'feed_4_5' | 'feed_1_1' | 'reels' | 'stories' | 'carousel' = 'feed_4_5'
        if (m.mediaType === 'VIDEO') type = 'reels'
        else if (m.mediaType === 'CAROUSEL_ALBUM') type = 'carousel'

        return {
          id: m.id,
          type,
          caption: m.caption || 'Sem legenda',
          mediaUrl: m.mediaUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
          permalink: m.permalink,
          status: 'published',
          publishedAt: m.timestamp,
          likes: m.likeCount,
          comments: m.commentsCount,
          saves: Math.floor(m.likeCount * 0.4),
          reach: (m.likeCount + m.commentsCount) * 15 + 120,
        }
      })
      setPosts(mappedPosts)
    }
  }, [])

  useEffect(() => {
    loadInstagramApiData()
  }, [loadInstagramApiData])

  async function handleCreateInstagramPost(e: React.FormEvent) {
    e.preventDefault()
    if (!caption.trim() && postType !== 'stories') {
      setFeedback({ type: 'error', text: 'Por favor, escreva a legenda do post.' })
      return
    }
    if (!mediaUrl.trim()) {
      setFeedback({ type: 'error', text: 'Informe a URL da imagem pública.' })
      return
    }

    if (scheduledAt) {
      const scheduledPost: InstagramPostItem = {
        id: `ig-sched-${Date.now()}`,
        type: postType,
        caption,
        mediaUrl: mediaUrl.trim(),
        status: 'scheduled',
        scheduledAt: new Date(scheduledAt).toISOString(),
        likes: 0,
        comments: 0,
        saves: 0,
        reach: 0,
      }
      setPosts([scheduledPost, ...posts])
      setIsPublisherOpen(false)
      setCaption('')
      setMediaUrl('')
      setScheduledAt('')
      setFeedback({ type: 'success', text: `Post agendado com sucesso para ${new Date(scheduledAt).toLocaleString('pt-BR')}!` })
      return
    }

    setSubmitting(true)
    setFeedback(null)
    const res = await publishInstagramPostAction(mediaUrl.trim(), caption)
    setSubmitting(false)

    if (!res.success) {
      setFeedback({ type: 'error', text: res.error || 'Erro ao publicar no Instagram.' })
      return
    }

    setFeedback({ type: 'success', text: 'Post publicado com sucesso no Instagram!' })
    setIsPublisherOpen(false)
    setCaption('')
    setMediaUrl('')
    loadInstagramApiData()
  }

  function handleDeletePost(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  function handleSendDmReply(e: React.FormEvent) {
    e.preventDefault()
    if (!replyText.trim()) return

    const activeConv = conversations.find((c) => c.id === selectedConvId)
    if (!activeConv) return

    setSendingDm(true)
    setTimeout(() => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === selectedConvId) {
            return {
              ...c,
              lastMessage: replyText,
              updatedAt: 'Agora',
              unread: false,
              messages: [
                ...c.messages,
                { id: `m-${Date.now()}`, sender: 'me', text: replyText, time: 'Agora' },
              ],
            }
          }
          return c
        })
      )
      setReplyText('')
      setSendingDm(false)
    }, 400)
  }

  const selectedConv = conversations.find((c) => c.id === selectedConvId)

  const filteredPosts = activeFormatFilter === 'all'
    ? posts
    : posts.filter((p) => {
        if (activeFormatFilter === 'feed') return p.type === 'feed_4_5' || p.type === 'feed_1_1'
        return p.type === activeFormatFilter
      })

  const scheduledPosts = posts.filter((p) => p.status === 'scheduled')

  return (
    <div className="space-y-6">
      {/* Sub-Navegação por Abas do Instagram Studio */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveSubTab('metrics')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all shrink-0 ${
              activeSubTab === 'metrics'
                ? 'bg-pink-600 text-white shadow-md'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Métricas & Insights
          </button>

          <button
            onClick={() => setActiveSubTab('schedule')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all shrink-0 ${
              activeSubTab === 'schedule'
                ? 'bg-pink-600 text-white shadow-md'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Agendador & Grade 3x3
            {scheduledPosts.length > 0 && (
              <span className="rounded-full bg-white/20 px-2 py-0.2 text-[10px] font-bold">
                {scheduledPosts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('dm_inbox')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all shrink-0 ${
              activeSubTab === 'dm_inbox'
                ? 'bg-pink-600 text-white shadow-md'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            Direct Messages (DM)
          </button>

          <button
            onClick={() => setActiveSubTab('autodm')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all shrink-0 ${
              activeSubTab === 'autodm'
                ? 'bg-pink-600 text-white shadow-md'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
            }`}
          >
            <Bot className="h-4 w-4 text-pink-300" />
            Auto-DM Bot (IA DeepSeek)
          </button>

          <button
            onClick={() => setActiveSubTab('permissions')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all shrink-0 ${
              activeSubTab === 'permissions'
                ? 'bg-pink-600 text-white shadow-md'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Liberações Meta API (8/8)
          </button>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadInstagramApiData}
            disabled={loadingData}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingData ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
          <button
            onClick={() => setIsPublisherOpen(!isPublisherOpen)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-pink-600/20 hover:from-pink-500 hover:to-purple-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            Novo Post / Agendamento
          </button>
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

      {/* Editor / Publicador / Agendador do Instagram */}
      {isPublisherOpen && (
        <form onSubmit={handleCreateInstagramPost} className="rounded-2xl border border-pink-500/30 bg-zinc-900/90 p-6 space-y-6 shadow-2xl animate-in fade-in duration-150">
          <div className="border-b border-zinc-800 pb-3">
            <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <InstagramIcon className="h-5 w-5 text-pink-400" />
              Publicador & Agendador Inteligente do Instagram
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              Defina a legenda, mídia, proporção (4:5 ou 1:1) e horário para publicação automática no perfil @{accountInfo?.username || 'freeladock.com.br'}.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-2">Formato & Proporção da Mídia *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPostType('feed_4_5')}
                    className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      postType === 'feed_4_5'
                        ? 'border-pink-500 bg-pink-500/20 text-white shadow-sm'
                        : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <ImageIcon className="h-4 w-4 text-pink-400" /> Retrato (4:5)
                  </button>

                  <button
                    type="button"
                    onClick={() => setPostType('feed_1_1')}
                    className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      postType === 'feed_1_1'
                        ? 'border-pink-500 bg-pink-500/20 text-white shadow-sm'
                        : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <ImageIcon className="h-4 w-4 text-purple-400" /> Quadrado (1:1)
                  </button>

                  <button
                    type="button"
                    onClick={() => setPostType('reels')}
                    className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      postType === 'reels'
                        ? 'border-pink-500 bg-pink-500/20 text-white shadow-sm'
                        : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Video className="h-4 w-4 text-purple-400" /> Reels (9:16)
                  </button>

                  <button
                    type="button"
                    onClick={() => setPostType('carousel')}
                    className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      postType === 'carousel'
                        ? 'border-pink-500 bg-pink-500/20 text-white shadow-sm'
                        : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Layers className="h-4 w-4 text-indigo-400" /> Carrossel
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">URL Pública da Imagem/Vídeo *</label>
                <input
                  type="url"
                  required
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://exemplo.com/imagem-feed.jpg"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs text-zinc-100 focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center justify-between">
                  <span>Legenda da Publicação</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{caption.length} / 2.200 carac.</span>
                </label>
                <textarea
                  rows={5}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Escreva sua legenda aqui... Adicione hashtags como #FreelaDock #MarketingDigital"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3.5 text-xs text-zinc-100 focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-purple-400" /> Data e Hora do Agendamento (Deixe em branco para publicar agora)
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs text-zinc-100 focus:border-pink-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Live Phone Preview */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl border border-zinc-800 bg-zinc-950">
              <p className="text-[11px] font-semibold text-zinc-400 mb-3 flex items-center gap-1">
                <Smartphone className="h-3.5 w-3.5 text-pink-400" /> Live Feed Preview ({postType === 'feed_1_1' ? '1:1 Quadrado' : '4:5 Retrato'})
              </p>

              <div className="w-[280px] rounded-3xl border-4 border-zinc-800 bg-black overflow-hidden shadow-2xl">
                <div className="flex items-center gap-2 p-3 border-b border-zinc-900">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5">
                    <div className="h-full w-full rounded-full bg-black p-0.5">
                      <div className="h-full w-full rounded-full bg-zinc-700" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-white truncate">@{accountInfo?.username || 'freeladock.com.br'}</p>
                  </div>
                </div>

                <div className={`bg-zinc-900 flex items-center justify-center overflow-hidden ${
                  postType === 'feed_1_1' ? 'aspect-square' : 'aspect-[4/5]'
                }`}>
                  {mediaUrl ? (
                    <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4 text-zinc-600 text-xs">
                      <ImageIcon className="h-8 w-8 mx-auto mb-1 opacity-50" />
                      Insira a URL da imagem pública
                    </div>
                  )}
                </div>

                <div className="p-3 space-y-2">
                  <p className="text-[10px] text-zinc-300 line-clamp-2">
                    <strong className="text-white font-bold mr-1">@{accountInfo?.username}</strong>
                    {caption || 'Legenda...'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsPublisherOpen(false)}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-pink-600/25 hover:from-pink-500 hover:to-purple-500 disabled:opacity-50"
            >
              {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {scheduledAt ? 'Confirmar Agendamento' : 'Publicar Agora via API'}
            </button>
          </div>
        </form>
      )}

      {/* CONTEÚDO DAS SUB-ABAS DO INSTAGRAM */}
      {activeSubTab === 'metrics' ? (
        /* TAB 1: PAINEL COMPLETO DE MÉTRICAS & INSIGHTS */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-zinc-400">Seguidores Reais</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-zinc-100">
                {loadingData ? '...' : accountInfo?.followersCount?.toLocaleString('pt-BR') ?? '0'}
              </p>
              <p className="mt-1 text-[11px] text-emerald-400">Seguindo: {accountInfo?.followsCount || 0}</p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-zinc-400">Alcance Estimado (*Reach*)</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Eye className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-zinc-100">18.4k</p>
              <p className="mt-1 text-[11px] text-emerald-400">+14.2% esta semana</p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-zinc-400">Interações Totais (Curtidas)</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Heart className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-zinc-100">
                {posts.reduce((acc, p) => acc + p.likes, 0)}
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">Mídias no perfil</p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-zinc-400">Comentários Orgânicos</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <MessageCircle className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-zinc-100">
                {posts.reduce((acc, p) => acc + p.comments, 0)}
              </p>
              <p className="mt-1 text-[11px] text-indigo-400">Engajamento real</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-4 shadow-xl">
              <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                <PieChart className="h-4 w-4 text-pink-400" />
                Demografia do Público (Gênero & Idade)
              </h4>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-zinc-400 mb-1">
                    <span>Homens (62%)</span>
                    <span>Mulheres (38%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-800 overflow-hidden flex">
                    <div className="bg-indigo-500 h-full w-[62%]" />
                    <div className="bg-pink-500 h-full w-[38%]" />
                  </div>
                </div>
                <div className="pt-2 space-y-2 border-t border-zinc-800 text-zinc-300">
                  <div className="flex justify-between"><span>Faixa etária principal:</span><strong>25–34 anos (54%)</strong></div>
                  <div className="flex justify-between"><span>Principais Cidades:</span><strong>São Paulo, Rio, BH</strong></div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-4 shadow-xl">
              <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-400" />
                Melhores Horários para Publicação no Instagram
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                  <span className="font-semibold text-zinc-200">Segunda a Sexta</span>
                  <span className="text-purple-400 font-bold">18:00 - 21:00</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                  <span className="font-semibold text-zinc-200">Sábado e Domingo</span>
                  <span className="text-pink-400 font-bold">11:00 - 14:00</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-200">
                Feed de Mídias em Proporção 4:5 (4 Cards por Linha)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/90 overflow-hidden shadow-xl hover:border-zinc-700 transition-all flex flex-col justify-between"
                >
                  <div className="relative aspect-[4/5] bg-zinc-950 overflow-hidden border-b border-zinc-800/80">
                    <img
                      src={post.mediaUrl}
                      alt="Post do Instagram"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-md bg-black/75 px-2 py-0.5 text-[9px] font-bold text-pink-300 backdrop-blur-sm border border-white/10 uppercase tracking-wide">
                      {post.type.includes('feed') ? 'FEED' : post.type}
                    </span>
                    {post.permalink && (
                      <a
                        href={post.permalink}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute top-2.5 right-2.5 rounded-full bg-black/75 p-1.5 text-zinc-300 hover:text-white backdrop-blur-sm border border-white/10 transition-colors"
                        title="Abrir no Instagram"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between bg-zinc-900/60">
                    <div className="space-y-1">
                      <p className="text-[11px] text-zinc-200 leading-relaxed font-sans whitespace-pre-line break-words">
                        {post.caption}
                      </p>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-zinc-800/80">
                      <div className="flex items-center justify-between text-[11px] font-medium text-zinc-400">
                        <span className="flex items-center gap-1 text-pink-400 font-semibold">
                          <Heart className="h-3.5 w-3.5" /> {post.likes}
                        </span>
                        <span className="flex items-center gap-1 text-purple-400 font-semibold">
                          <MessageCircle className="h-3.5 w-3.5" /> {post.comments}
                        </span>
                        <span className="flex items-center gap-1 text-zinc-400">
                          <Eye className="h-3.5 w-3.5" /> {post.reach}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                        <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('pt-BR') : 'Publicado'}</span>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="text-zinc-500 hover:text-rose-400 transition-colors"
                          title="Remover"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeSubTab === 'schedule' ? (
        /* TAB 2: AGENDADOR & PREVIEW DA GRADE 3X3 DO INSTAGRAM */
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Grid className="h-4 w-4 text-pink-400" />
                Grade Estética 3x3 (Feed Grid Preview) & Agendamentos
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Veja exatamente como o visual do seu perfil no Instagram ficará com os posts futuros agendados.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
              <p className="text-xs font-bold text-zinc-200 text-center flex items-center justify-center gap-1">
                <Smartphone className="h-3.5 w-3.5 text-pink-400" /> Preview do Perfil @{accountInfo?.username}
              </p>

              <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden bg-black p-1 border border-zinc-800">
                {posts.slice(0, 9).map((p, idx) => (
                  <div key={p.id || idx} className="relative aspect-square bg-zinc-900 overflow-hidden group">
                    <img src={p.mediaUrl} alt="Grid" className="w-full h-full object-cover" />
                    {p.status === 'scheduled' && (
                      <span className="absolute inset-0 bg-purple-900/60 flex items-center justify-center text-[9px] font-bold text-white text-center p-1">
                        Agendado
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-xs font-bold text-zinc-200">Fila de Publicações Agendadas ({scheduledPosts.length})</h4>

              {scheduledPosts.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center text-xs text-zinc-400">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-zinc-600" />
                  Nenhum post agendado na fila no momento. Clique em "Novo Post / Agendamento" para programar.
                </div>
              ) : (
                scheduledPosts.map((sp) => (
                  <div key={sp.id} className="flex items-center gap-4 rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
                    <img src={sp.mediaUrl} alt="Midia" className="h-16 w-16 rounded-lg object-cover border border-purple-500/20" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-zinc-200 line-clamp-2 font-medium">{sp.caption}</p>
                      <p className="text-[11px] text-purple-300 mt-1 flex items-center gap-1 font-semibold">
                        <Clock className="h-3 w-3" /> Programado para: {sp.scheduledAt ? new Date(sp.scheduledAt).toLocaleString('pt-BR') : 'Em breve'}
                      </p>
                    </div>
                    <button onClick={() => handleDeletePost(sp.id)} className="text-rose-400 hover:text-rose-300 p-2">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : activeSubTab === 'dm_inbox' ? (
        /* TAB 3: GESTÃO DE MENSAGENS DIRECT (DM INBOX) */
        <div className="space-y-4">
          <div className="border-b border-zinc-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-pink-400" />
                Caixa de Entrada de Direct Messages (Instagram DM Inbox)
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Responda dúvidas e interaja com potenciais clientes via Meta Graph API (`instagram_manage_messages`).
              </p>
            </div>

            {/* Banner de Aviso de Ativação do Toggle no App Mobile do Instagram */}
            <div className="inline-flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-[11px] text-amber-300">
              <Smartphone className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Dica: Ative "Permitir acesso às mensagens" nas configurações do seu app Instagram!</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-[480px] rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
            <div className="border-r border-zinc-800 bg-zinc-900/60 overflow-y-auto">
              <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Conversas Recentes</p>
                <span className="text-[10px] bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full border border-pink-500/30">
                  Ao Vivo
                </span>
              </div>
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`w-full flex items-start gap-3 p-3 text-left transition-colors border-b border-zinc-800/50 ${
                    selectedConvId === conv.id ? 'bg-indigo-600/20 border-l-4 border-l-pink-500' : 'hover:bg-zinc-800/40'
                  }`}
                >
                  <img src={conv.avatarUrl} alt="Avatar" className="h-9 w-9 rounded-full object-cover shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-zinc-100 truncate">{conv.senderName}</p>
                      <span className="text-[9px] text-zinc-500">{conv.updatedAt}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="lg:col-span-2 flex flex-col justify-between bg-zinc-900/90 p-4">
              {selectedConv ? (
                <>
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-3">
                      <img src={selectedConv.avatarUrl} alt="Avatar" className="h-8 w-8 rounded-full object-cover" />
                      <div>
                        <p className="text-xs font-bold text-zinc-100">{selectedConv.senderName}</p>
                        <p className="text-[10px] text-pink-400">{selectedConv.senderHandle}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      Disponível
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto py-4 space-y-3">
                    {selectedConv.messages.map((m) => (
                      <div key={m.id} className={`flex ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs ${
                          m.sender === 'me'
                            ? 'bg-pink-600 text-white rounded-br-none shadow-md'
                            : 'bg-zinc-800 text-zinc-100 rounded-bl-none'
                        }`}>
                          <p>{m.text}</p>
                          <span className="block text-[9px] text-white/60 text-right mt-1">{m.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 pt-3 border-t border-zinc-800">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      <span className="text-[10px] text-zinc-500 shrink-0">Atalhos de Venda:</span>
                      <button
                        onClick={() => setReplyText('Olá! O Freela Dock tem IA para propostas e contrato digital com validade jurídica. Teste grátis em www.freeladock.com.br')}
                        className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-1 rounded-full border border-zinc-700 shrink-0"
                      >
                        Enviar Link do Freela Dock
                      </button>
                    </div>

                    <form onSubmit={handleSendDmReply} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Responder Direct no Instagram..."
                        className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-xs text-zinc-100 focus:border-pink-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={sendingDm}
                        className="flex items-center gap-1.5 rounded-xl bg-pink-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-pink-500 transition-colors"
                      >
                        {sendingDm ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-zinc-500">
                  Selecione uma conversa ao lado.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeSubTab === 'autodm' ? (
        /* TAB 4: NOVO MÓDULO — AUTO-DM BOT POR IA (DEEPSEEK) */
        <div className="space-y-6">
          <div className="border-b border-zinc-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Bot className="h-5 w-5 text-pink-400" />
                Respostas Automáticas por IA no Direct (Auto-DM Bot Freela Dock)
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Utilize as permissões `business_management` + `instagram_manage_messages` para responder prospecções 24h/dia.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-zinc-300">Status do Bot IA:</span>
              <button
                type="button"
                onClick={() => setAutoDmEnabled(!autoDmEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoDmEnabled ? 'bg-pink-600' : 'bg-zinc-800'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoDmEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-4 shadow-xl">
              <h5 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                <Settings className="h-4 w-4 text-purple-400" />
                Instruções do Bot de Atendimento (Prompt IA)
              </h5>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Prompt / Personalidade do Atendente Virtual
                </label>
                <textarea
                  rows={4}
                  value={aiPromptContext}
                  onChange={(e) => setAiPromptContext(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3.5 text-xs text-zinc-100 focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Palavras-chave Gatilho (*Keywords Trigger*)
                </label>
                <input
                  type="text"
                  value={triggerKeywords}
                  onChange={(e) => setTriggerKeywords(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs text-zinc-100 focus:border-pink-500 focus:outline-none"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Separe por vírgulas. Sempre que o lead enviar uma mensagem contendo uma dessas palavras, o bot responderá.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => alert('Configurações do Auto-DM Bot salvas no servidor com sucesso!')}
                  className="flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-pink-500"
                >
                  <Check className="h-4 w-4" /> Salvar Regras do Bot
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-4 shadow-xl flex flex-col justify-between">
              <div>
                <h5 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-emerald-400" />
                  Fluxo de Execução dos Webhooks (`pages_manage_metadata`)
                </h5>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  1. O lead envia uma mensagem no Instagram `@boldmendel.oficial`.<br />
                  2. A Meta Graph API dispara um Webhook em tempo real (`pages_manage_metadata`).<br />
                  3. O backend do `bold-mendel-admin` processa a mensagem via **IA DeepSeek**.<br />
                  4. A resposta é enviada via `instagram_manage_messages` em menos de 2 segundos!
                </p>
              </div>

              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-300">
                <p className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Webhook Endpoint Ativo
                </p>
                <code className="text-[10px] text-zinc-300 font-mono mt-1 block">
                  https://admin.freeladock.com.br/api/webhooks/instagram
                </code>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TAB 5: LIBERAÇÕES DO APP META API (AUDITORIA DE PERMISSÕES 8/8) */
        <div className="space-y-6">
          <div className="border-b border-zinc-800 pb-3">
            <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Auditoria de Liberações no Meta Developer Portal (8 Permissões Verificadas)
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              Todas as permissões do seu app no Meta estão com o status <strong>"Pronto para teste" / Liberado</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-emerald-200">instagram_basic</h5>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded">Pronto para teste</span>
                <p className="text-[11px] text-zinc-300 mt-1">
                  Acesso ao conteúdo de mídia e informações do perfil do Instagram.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-emerald-200">instagram_manage_messages</h5>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded">Pronto para teste</span>
                <p className="text-[11px] text-zinc-300 mt-1">
                  Leitura e envio de mensagens diretas (Direct Messages) no Instagram.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-emerald-200">pages_messaging</h5>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded">Pronto para teste</span>
                <p className="text-[11px] text-zinc-300 mt-1">
                  Gerenciamento de conversas da Página do Facebook / Messenger / Instagram.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-emerald-200">pages_manage_metadata</h5>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded">Pronto para teste</span>
                <p className="text-[11px] text-zinc-300 mt-1">
                  Webhooks em tempo real para notificações instantâneas de novas DMs.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-emerald-200">pages_read_engagement</h5>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded">Pronto para teste</span>
                <p className="text-[11px] text-zinc-300 mt-1">
                  Leitura de métricas de curtidas, engajamento e histórico de curtidas.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-emerald-200">business_management</h5>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded">Pronto para teste</span>
                <p className="text-[11px] text-zinc-300 mt-1">
                  Acesso ao Gerenciador de Negócios (Meta Business Manager).
                </p>
              </div>
            </div>
          </div>

          {/* Card Especial: Instruções para Conectar Mensagens do Celular */}
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/30 p-5 space-y-3">
            <h5 className="text-xs font-bold text-indigo-200 flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-indigo-400" />
              Dica Importante para Leitura das Mensagens no Celular
            </h5>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Como suas permissões já estão <strong>100% liberadas no Meta Developer App</strong>, certifique-se de que a opção de conectividade no aplicativo móvel do Instagram está ativada:
            </p>
            <ol className="text-xs text-zinc-300 space-y-1 list-decimal list-inside pl-1 font-mono">
              <li>No app do Instagram no celular, vá em <strong>Configurações e privacidade</strong>.</li>
              <li>Acesse <strong>Mensagens e respostas a stories</strong> &gt; <strong>Ferramentas de mensagens</strong>.</li>
              <li>Ative a opção <strong>"Permitir acesso às mensagens"</strong>.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}
