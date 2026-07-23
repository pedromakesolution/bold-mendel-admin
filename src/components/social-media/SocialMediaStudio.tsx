'use client'

import { useState } from 'react'
import {
  Share2,
  Plus,
  Calendar,
  Clock,
  Sparkles,
  TrendingUp,
  Users,
  Eye,
  MessageCircle,
  Heart,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Send,
  Trash2,
  Edit3,
  ExternalLink,
  Zap,
} from 'lucide-react'

// Ícones SVG personalizados para cada rede social
function InstagramIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  )
}

function LinkedinIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
    </svg>
  )
}

function FacebookIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
    </svg>
  )
}

function TwitterIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}

interface SocialChannel {
  id: string
  name: string
  handle: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  borderColor: string
  connected: boolean
  followers: string
  engagement: string
}

interface SocialPost {
  id: string
  channels: string[]
  content: string
  imageUrl?: string
  status: 'scheduled' | 'draft' | 'published'
  scheduledAt?: string
  publishedAt?: string
  likes?: number
  comments?: number
  shares?: number
}

export default function SocialMediaStudio() {
  const [channels, setChannels] = useState<SocialChannel[]>([
    {
      id: 'instagram',
      name: 'Instagram',
      handle: '@boldmendel.oficial',
      icon: InstagramIcon,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/30',
      connected: true,
      followers: '12.4k',
      engagement: '4.8%',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      handle: 'Bold Mendel Digital',
      icon: LinkedinIcon,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      connected: true,
      followers: '8.1k',
      engagement: '6.2%',
    },
    {
      id: 'facebook',
      name: 'Facebook',
      handle: 'Bold Mendel Brasil',
      icon: FacebookIcon,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/10',
      borderColor: 'border-sky-500/30',
      connected: false,
      followers: '5.2k',
      engagement: '2.1%',
    },
    {
      id: 'twitter',
      name: 'X (Twitter)',
      handle: '@boldmendel',
      icon: TwitterIcon,
      color: 'text-zinc-200',
      bgColor: 'bg-zinc-800',
      borderColor: 'border-zinc-700',
      connected: true,
      followers: '15.9k',
      engagement: '3.5%',
    },
  ])

  const [posts, setPosts] = useState<SocialPost[]>([
    {
      id: '1',
      channels: ['instagram', 'linkedin'],
      content: '🚀 Sem trabalho invisível! Lançamos a nova atualização do Freela Dock com automação completa da Brevo e painel integrado. Confira no link da bio!',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      status: 'scheduled',
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    },
    {
      id: '2',
      channels: ['linkedin', 'twitter'],
      content: '💡 Dica para freelancers e agências: Automatize o envio de propostas e acompanhamento de e-mails para multiplicar sua conversão sem perder tempo operacional.',
      status: 'published',
      publishedAt: new Date(Date.now() - 172800000).toISOString(),
      likes: 142,
      comments: 28,
      shares: 19,
    },
  ])

  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['instagram', 'linkedin'])
  const [postContent, setPostContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function toggleChannelConnect(channelId: string) {
    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, connected: !c.connected } : c))
    )
  }

  function toggleSelectedChannel(channelId: string) {
    setSelectedChannels((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    )
  }

  function handleCreatePost(e: React.FormEvent) {
    e.preventDefault()
    if (!postContent.trim()) {
      setFeedback({ type: 'error', text: 'Escreva o texto do post.' })
      return
    }
    if (selectedChannels.length === 0) {
      setFeedback({ type: 'error', text: 'Selecione ao menos uma rede social.' })
      return
    }

    const newPost: SocialPost = {
      id: String(Date.now()),
      channels: selectedChannels,
      content: postContent,
      imageUrl: imageUrl.trim() || undefined,
      status: scheduledAt ? 'scheduled' : 'published',
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      publishedAt: scheduledAt ? undefined : new Date().toISOString(),
      likes: scheduledAt ? undefined : 0,
      comments: scheduledAt ? undefined : 0,
    }

    setPosts([newPost, ...posts])
    setIsComposerOpen(false)
    setPostContent('')
    setImageUrl('')
    setScheduledAt('')
    setFeedback({ type: 'success', text: 'Post agendado/publicado com sucesso no Studio!' })
  }

  function handleDeletePost(id: string) {
    setPosts(posts.filter((p) => p.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Studio Header Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-400">Alcance Total</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-100">41.6k</p>
          <p className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> +14.2% este mês
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-400">Engajamento Médio</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <Heart className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-100">4.6%</p>
          <p className="mt-1 text-[11px] text-zinc-500">Média entre canais ativos</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-400">Posts Agendados</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-100">
            {posts.filter((p) => p.status === 'scheduled').length}
          </p>
          <p className="mt-1 text-[11px] text-purple-400 font-medium">Próximo post amanhã</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-400">Canais Conectados</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Share2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-100">
            {channels.filter((c) => c.connected).length} / {channels.length}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">Contas ativas</p>
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

      {/* Grid de Canais de Redes Sociais Conectados */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            Canais de Redes Sociais Integrados
          </h3>
          <span className="text-[11px] text-zinc-500">Conecte e gerencie suas contas de publicação</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {channels.map((c) => {
            const Icon = c.icon
            return (
              <div
                key={c.id}
                className={`relative rounded-2xl border ${c.borderColor} ${c.bgColor} p-4 backdrop-blur-sm transition-all hover:scale-[1.01]`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl bg-zinc-900/80 ${c.color} shadow-sm`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-100">{c.name}</h4>
                      <p className="text-[11px] text-zinc-400 truncate max-w-[120px]">{c.handle}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleChannelConnect(c.id)}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-all ${
                      c.connected
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    {c.connected ? 'Conectado' : 'Conectar'}
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-zinc-800/60 pt-3 text-[11px] text-zinc-400">
                  <span>Seguidores: <strong className="text-zinc-200">{c.followers}</strong></span>
                  <span>Engajamento: <strong className="text-zinc-200">{c.engagement}</strong></span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Studio Header + Create Post Action */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-400" />
            Feed de Publicações & Agendamento
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Crie conteúdo unificado e programe o disparo simultâneo nas suas redes sociais.
          </p>
        </div>

        <button
          onClick={() => setIsComposerOpen(!isComposerOpen)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:from-indigo-500 hover:to-purple-500 transition-all"
        >
          <Plus className="h-4 w-4" />
          {isComposerOpen ? 'Fechar Criador' : 'Criar Nova Publicação'}
        </button>
      </div>

      {/* Post Composer Drawer / Card */}
      {isComposerOpen && (
        <form onSubmit={handleCreatePost} className="rounded-2xl border border-indigo-500/30 bg-zinc-900/90 p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-indigo-400" />
              Publicar / Agendar em Múltiplas Redes
            </h4>
            <span className="text-xs text-zinc-400">Selecione os canais de destino</span>
          </div>

          {/* Seletor de Canais para a publicação */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-2">Selecione as Redes Sociais Alvo *</label>
            <div className="flex flex-wrap items-center gap-3">
              {channels.map((c) => {
                const Icon = c.icon
                const isSel = selectedChannels.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleSelectedChannel(c.id)}
                    className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
                      isSel
                        ? 'border-indigo-500 bg-indigo-500/20 text-white shadow-sm'
                        : 'border-zinc-800 bg-zinc-950/60 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${c.color}`} />
                    <span>{c.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Texto da Publicação *</label>
            <textarea
              required
              rows={4}
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Escreva sua publicação aqui... Adicione hashtags como #FreelaDock #Automatizacao"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1">
                <ImageIcon className="h-3.5 w-3.5 text-zinc-400" /> URL da Imagem da Publicação (opcional)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://exemplo.com/imagem.png"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs text-zinc-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-zinc-400" /> Data/Hora de Agendamento (Deixe em branco para publicar agora)
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs text-zinc-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsComposerOpen(false)}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              <Send className="h-3.5 w-3.5" />
              {scheduledAt ? 'Agendar Publicação' : 'Publicar Agora'}
            </button>
          </div>
        </form>
      )}

      {/* Feed de Publicações Criadas */}
      <div className="space-y-4">
        {posts.map((p) => (
          <div
            key={p.id}
            className="flex flex-col md:flex-row gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg hover:border-zinc-700 transition-all"
          >
            {p.imageUrl && (
              <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden bg-zinc-950 shrink-0 border border-zinc-800">
                <img src={p.imageUrl} alt="Midia da publicação" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {p.channels.map((chId) => {
                    const ch = channels.find((c) => c.id === chId)
                    if (!ch) return null
                    const Icon = ch.icon
                    return (
                      <span
                        key={chId}
                        className={`inline-flex items-center gap-1 rounded-md ${ch.bgColor} px-2 py-0.5 text-[11px] font-semibold ${ch.color} border ${ch.borderColor}`}
                      >
                        <Icon className="h-3 w-3" /> {ch.name}
                      </span>
                    )
                  })}
                </div>

                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    p.status === 'scheduled'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {p.status === 'scheduled' ? 'Agendado' : 'Publicado'}
                </span>
              </div>

              <p className="text-xs text-zinc-200 leading-relaxed font-sans">{p.content}</p>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-500">
                <div className="flex items-center gap-4">
                  {p.status === 'scheduled' && p.scheduledAt && (
                    <span className="flex items-center gap-1 text-purple-400">
                      <Clock className="h-3 w-3" /> Agendado para {new Date(p.scheduledAt).toLocaleString('pt-BR')}
                    </span>
                  )}
                  {p.status === 'published' && p.publishedAt && (
                    <span className="flex items-center gap-1 text-zinc-400">
                      Publicado em {new Date(p.publishedAt).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                  {p.likes !== undefined && (
                    <span className="flex items-center gap-1 text-pink-400">
                      <Heart className="h-3 w-3" /> {p.likes} curtidas
                    </span>
                  )}
                  {p.comments !== undefined && (
                    <span className="flex items-center gap-1 text-blue-400">
                      <MessageCircle className="h-3 w-3" /> {p.comments} comentários
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleDeletePost(p.id)}
                  className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
                  title="Excluir"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
