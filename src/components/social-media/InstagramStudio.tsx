'use client'

import { useState } from 'react'
import {
  Sparkles,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  TrendingUp,
  Plus,
  Calendar,
  Clock,
  Image as ImageIcon,
  Video,
  Layers,
  Smartphone,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Send,
  Trash2,
  Key,
} from 'lucide-react'

function InstagramIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  )
}

export interface InstagramPostItem {
  id: string
  type: 'feed' | 'reels' | 'stories' | 'carousel'
  caption: string
  mediaUrl: string
  location?: string
  status: 'scheduled' | 'published' | 'draft'
  scheduledAt?: string
  publishedAt?: string
  likes: number
  comments: number
  saves: number
  reach: number
}

export default function InstagramStudio() {
  const [activeFormatFilter, setActiveFormatFilter] = useState<'all' | 'feed' | 'reels' | 'stories' | 'carousel'>('all')
  const [isPublisherOpen, setIsPublisherOpen] = useState(false)

  // Form State
  const [postType, setPostType] = useState<'feed' | 'reels' | 'stories' | 'carousel'>('feed')
  const [caption, setCaption] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [location, setLocation] = useState('São Paulo, Brasil')
  const [scheduledAt, setScheduledAt] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Posts locais de exemplo / gerenciados
  const [posts, setPosts] = useState<InstagramPostItem[]>([
    {
      id: 'ig-1',
      type: 'feed',
      caption: '🚀 A produtividade que sua equipe precisava. Conheça o Freela Dock, o portal definitivo para freelancers e agências inteligentes. #FreelaDock #Gestao #Produtividade',
      mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      location: 'São Paulo, Brasil',
      status: 'published',
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      likes: 342,
      comments: 48,
      saves: 89,
      reach: 4820,
    },
    {
      id: 'ig-2',
      type: 'reels',
      caption: '🎬 Bastidores do novo painel de E-mail Marketing e Automações da Brevo! Assista até o final para ver a prévia. #Reels #DevLife #MarketingDigital',
      mediaUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
      status: 'scheduled',
      scheduledAt: new Date(Date.now() + 172800000).toISOString(),
      likes: 0,
      comments: 0,
      saves: 0,
      reach: 0,
    },
    {
      id: 'ig-3',
      type: 'stories',
      caption: '⚡ Pergunta do dia: Você já automatizou o envio de propostas para seus clientes?',
      mediaUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
      status: 'published',
      publishedAt: new Date(Date.now() - 43200000).toISOString(),
      likes: 120,
      comments: 15,
      saves: 12,
      reach: 1950,
    },
  ])

  function handleCreateInstagramPost(e: React.FormEvent) {
    e.preventDefault()
    if (!caption.trim() && postType !== 'stories') {
      setFeedback({ type: 'error', text: 'Por favor, escreva a legenda do post.' })
      return
    }

    const newPost: InstagramPostItem = {
      id: `ig-${Date.now()}`,
      type: postType,
      caption,
      mediaUrl: mediaUrl.trim() || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      location,
      status: scheduledAt ? 'scheduled' : 'published',
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      publishedAt: scheduledAt ? undefined : new Date().toISOString(),
      likes: 0,
      comments: 0,
      saves: 0,
      reach: 0,
    }

    setPosts([newPost, ...posts])
    setIsPublisherOpen(false)
    setCaption('')
    setMediaUrl('')
    setScheduledAt('')
    setFeedback({ type: 'success', text: `Publicação (${postType.toUpperCase()}) cadastrada com sucesso para o Instagram!` })
  }

  function handleDeletePost(id: string) {
    setPosts(posts.filter((p) => p.id !== id))
  }

  const filteredPosts = activeFormatFilter === 'all'
    ? posts
    : posts.filter((p) => p.type === activeFormatFilter)

  return (
    <div className="space-y-8">
      {/* Banner de Status da API Graph da Meta / Instagram */}
      <div className="rounded-2xl border border-pink-500/20 bg-gradient-to-br from-pink-950/30 via-zinc-900 to-purple-950/40 p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20 shrink-0">
              <InstagramIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                Meta Graph API (Instagram Business)
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                  Pronto para Conectar
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Conta: <strong>@boldmendel.oficial</strong> • ID da Conta Comercial: 17841400928374
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => alert('As chaves de API da Meta Graph API (Access Token & Business ID) estão prontas para inclusão no .env.local.')}
            className="flex items-center gap-2 rounded-xl border border-pink-500/30 bg-pink-500/10 px-3.5 py-2 text-xs font-semibold text-pink-300 hover:bg-pink-500/20 transition-colors shrink-0"
          >
            <Key className="h-3.5 w-3.5" />
            Configurar Token de Acesso
          </button>
        </div>
      </div>

      {/* Métricas Permitidas pela Graph API do Instagram */}
      <div>
        <h3 className="text-sm font-bold text-zinc-200 mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-pink-400" />
          Métricas de Desempenho (Instagram Business Insights)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-400">Alcance Total (*Reach*)</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
                <Eye className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-zinc-100">18.4k</p>
            <p className="mt-1 text-[11px] text-emerald-400">+14.2% em relação à semana passada</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-400">Visitas ao Perfil</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-zinc-100">1.240</p>
            <p className="mt-1 text-[11px] text-zinc-500">Últimos 30 dias</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-400">Curtidas & Interações</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Heart className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-zinc-100">3.820</p>
            <p className="mt-1 text-[11px] text-zinc-500">Média de 284 por post</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-400">Salvamentos no Perfil</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Bookmark className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-zinc-100">492</p>
            <p className="mt-1 text-[11px] text-indigo-400">Alta intenção de compra</p>
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

      {/* Header do Publicador e Filtro de Formatos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveFormatFilter('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeFormatFilter === 'all'
                ? 'bg-pink-600 text-white shadow-md'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Todos os Formatos ({posts.length})
          </button>
          <button
            onClick={() => setActiveFormatFilter('feed')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeFormatFilter === 'feed'
                ? 'bg-pink-600 text-white shadow-md'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            Feed
          </button>
          <button
            onClick={() => setActiveFormatFilter('reels')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeFormatFilter === 'reels'
                ? 'bg-pink-600 text-white shadow-md'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Video className="h-3.5 w-3.5" />
            Reels
          </button>
          <button
            onClick={() => setActiveFormatFilter('stories')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeFormatFilter === 'stories'
                ? 'bg-pink-600 text-white shadow-md'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            Stories
          </button>
        </div>

        <button
          onClick={() => setIsPublisherOpen(!isPublisherOpen)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-pink-600/20 hover:from-pink-500 hover:to-purple-500 transition-all"
        >
          <Plus className="h-4 w-4" />
          {isPublisherOpen ? 'Fechar Criador' : 'Criar Post Instagram'}
        </button>
      </div>

      {/* Modal / Editor de Publicação do Instagram com Live Preview */}
      {isPublisherOpen && (
        <form onSubmit={handleCreateInstagramPost} className="rounded-2xl border border-pink-500/30 bg-zinc-900/90 p-6 space-y-6 shadow-2xl animate-in fade-in duration-150">
          <div className="border-b border-zinc-800 pb-3">
            <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <InstagramIcon className="h-5 w-5 text-pink-400" />
              Publicador Integrado do Instagram
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              Escolha o formato (Feed, Reels, Stories, Carrossel) e visualize o resultado em tempo real.
            </p>
          </div>

          {/* Seleção do Formato */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-2">Selecione o Formato da Publicação *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setPostType('feed')}
                className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border text-xs font-semibold transition-all ${
                  postType === 'feed'
                    ? 'border-pink-500 bg-pink-500/20 text-white shadow-md'
                    : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ImageIcon className="h-5 w-5 text-pink-400" />
                <span>Feed (Quadrado 1:1)</span>
              </button>

              <button
                type="button"
                onClick={() => setPostType('reels')}
                className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border text-xs font-semibold transition-all ${
                  postType === 'reels'
                    ? 'border-pink-500 bg-pink-500/20 text-white shadow-md'
                    : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Video className="h-5 w-5 text-purple-400" />
                <span>Reels (Vídeo 9:16)</span>
              </button>

              <button
                type="button"
                onClick={() => setPostType('stories')}
                className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border text-xs font-semibold transition-all ${
                  postType === 'stories'
                    ? 'border-pink-500 bg-pink-500/20 text-white shadow-md'
                    : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Smartphone className="h-5 w-5 text-rose-400" />
                <span>Stories (24 Horas)</span>
              </button>

              <button
                type="button"
                onClick={() => setPostType('carousel')}
                className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border text-xs font-semibold transition-all ${
                  postType === 'carousel'
                    ? 'border-pink-500 bg-pink-500/20 text-white shadow-md'
                    : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Layers className="h-5 w-5 text-indigo-400" />
                <span>Carrossel (Multimídia)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulário */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">URL da Mídia (Imagem ou Vídeo MP4) *</label>
                <input
                  type="url"
                  required
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs text-zinc-100 focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center justify-between">
                  <span>Legenda do Post (Legenda do Instagram)</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{caption.length} / 2.200 carac.</span>
                </label>
                <textarea
                  rows={5}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Escreva sua legenda aqui... Adicione hashtags como #FreelaDock #Marketing"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Localização</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Agendar Data/Hora (opcional)</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-100"
                  />
                </div>
              </div>
            </div>

            {/* Live Phone Preview estilo Instagram */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl border border-zinc-800 bg-zinc-950">
              <p className="text-[11px] font-semibold text-zinc-400 mb-3 flex items-center gap-1">
                <Smartphone className="h-3.5 w-3.5 text-pink-400" /> Pré-visualização ao vivo do Instagram
              </p>

              <div className="w-[280px] rounded-3xl border-4 border-zinc-800 bg-black overflow-hidden shadow-2xl">
                {/* Header do Post */}
                <div className="flex items-center gap-2 p-3 border-b border-zinc-900">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5">
                    <div className="h-full w-full rounded-full bg-black p-0.5">
                      <div className="h-full w-full rounded-full bg-zinc-700" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-white truncate">boldmendel.oficial</p>
                    <p className="text-[9px] text-zinc-400 truncate">{location}</p>
                  </div>
                </div>

                {/* Mídia */}
                <div className="h-56 bg-zinc-900 flex items-center justify-center overflow-hidden">
                  {mediaUrl ? (
                    <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4 text-zinc-600 text-xs">
                      <ImageIcon className="h-8 w-8 mx-auto mb-1 opacity-50" />
                      Insira a URL da imagem
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between text-zinc-200">
                    <div className="flex items-center gap-3">
                      <Heart className="h-4 w-4" />
                      <MessageCircle className="h-4 w-4" />
                      <Send className="h-4 w-4" />
                    </div>
                    <Bookmark className="h-4 w-4" />
                  </div>
                  <p className="text-[10px] font-bold text-white">0 curtidas</p>
                  <p className="text-[10px] text-zinc-300 line-clamp-2">
                    <strong className="text-white font-bold mr-1">boldmendel.oficial</strong>
                    {caption || 'Sua legenda do post aparecerá aqui...'}
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
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-pink-600/25 hover:from-pink-500 hover:to-purple-500"
            >
              <Send className="h-3.5 w-3.5" />
              {scheduledAt ? 'Agendar no Instagram' : 'Publicar no Instagram Agora'}
            </button>
          </div>
        </form>
      )}

      {/* Grid de Posts do Instagram */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/80 overflow-hidden shadow-xl hover:border-zinc-700 transition-all flex flex-col justify-between"
          >
            <div className="relative h-48 bg-zinc-950 overflow-hidden">
              <img src={post.mediaUrl} alt="Post do Instagram" className="w-full h-full object-cover" />
              <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-md bg-black/70 px-2.5 py-1 text-[10px] font-bold text-pink-300 backdrop-blur-sm border border-white/10 uppercase">
                {post.type}
              </span>
              <span
                className={`absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold backdrop-blur-sm ${
                  post.status === 'scheduled'
                    ? 'bg-purple-500/80 text-white'
                    : 'bg-emerald-500/80 text-white'
                }`}
              >
                {post.status === 'scheduled' ? 'Agendado' : 'Publicado'}
              </span>
            </div>

            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed font-sans">{post.caption}</p>

              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1 text-pink-400">
                    <Heart className="h-3.5 w-3.5" /> {post.likes}
                  </span>
                  <span className="flex items-center gap-1 text-purple-400">
                    <MessageCircle className="h-3.5 w-3.5" /> {post.comments}
                  </span>
                  <span className="flex items-center gap-1 text-indigo-400">
                    <Bookmark className="h-3.5 w-3.5" /> {post.saves}
                  </span>
                  <span className="flex items-center gap-1 text-zinc-400">
                    <Eye className="h-3.5 w-3.5" /> {post.reach}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                  <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('pt-BR') : 'Agendado'}</span>
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="text-zinc-500 hover:text-rose-400 transition-colors"
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
  )
}
