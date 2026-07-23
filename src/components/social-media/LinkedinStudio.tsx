'use client'

import { useState } from 'react'
import {
  TrendingUp,
  Users,
  Eye,
  MessageSquare,
  ThumbsUp,
  Share2,
  Plus,
  Calendar,
  Clock,
  Image as ImageIcon,
  FileText,
  Building2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Send,
  Trash2,
  Key,
  Globe,
} from 'lucide-react'

function LinkedinIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
    </svg>
  )
}

export interface LinkedinPostItem {
  id: string
  type: 'post' | 'article' | 'document'
  content: string
  mediaUrl?: string
  status: 'scheduled' | 'published' | 'draft'
  scheduledAt?: string
  publishedAt?: string
  reactions: number
  comments: number
  reposts: number
  impressions: number
}

export default function LinkedinStudio() {
  const [isPublisherOpen, setIsPublisherOpen] = useState(false)
  const [postType, setPostType] = useState<'post' | 'article' | 'document'>('post')
  const [content, setContent] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [posts, setPosts] = useState<LinkedinPostItem[]>([
    {
      id: 'li-1',
      type: 'post',
      content: '💼 Como aumentar a eficiência do trabalho remoto e eliminar tarefas repetitivas na sua agência ou consultoria? Lançamos o Freela Dock com automação inteligente de e-mails e gestão de clientes. Confiram o artigo completo!',
      mediaUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
      status: 'published',
      publishedAt: new Date(Date.now() - 172800000).toISOString(),
      reactions: 184,
      comments: 32,
      reposts: 14,
      impressions: 5420,
    },
    {
      id: 'li-2',
      type: 'article',
      content: '📝 Artigo: O Futuro do Trabalho Freelancer e a Importância da Automação de E-mails Marketing no Mercado B2B.',
      mediaUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
      status: 'scheduled',
      scheduledAt: new Date(Date.now() + 259200000).toISOString(),
      reactions: 0,
      comments: 0,
      reposts: 0,
      impressions: 0,
    },
  ])

  function handleCreateLinkedinPost(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) {
      setFeedback({ type: 'error', text: 'Escreva o texto da publicação do LinkedIn.' })
      return
    }

    const newPost: LinkedinPostItem = {
      id: `li-${Date.now()}`,
      type: postType,
      content,
      mediaUrl: mediaUrl.trim() || undefined,
      status: scheduledAt ? 'scheduled' : 'published',
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      publishedAt: scheduledAt ? undefined : new Date().toISOString(),
      reactions: 0,
      comments: 0,
      reposts: 0,
      impressions: 0,
    }

    setPosts([newPost, ...posts])
    setIsPublisherOpen(false)
    setContent('')
    setMediaUrl('')
    setScheduledAt('')
    setFeedback({ type: 'success', text: 'Publicação cadastrada com sucesso para a página do LinkedIn!' })
  }

  function handleDeletePost(id: string) {
    setPosts(posts.filter((p) => p.id !== id))
  }

  return (
    <div className="space-y-8">
      {/* Banner de Status da API da Company Page do LinkedIn */}
      <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/30 via-zinc-900 to-indigo-950/40 p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
              <LinkedinIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                LinkedIn Company Page API (Freela Dock)
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                  Conectado
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Organização: <strong>Freela Dock</strong> • ID da Organização: urn:li:organization:928374
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => alert('As chaves OAuth 2.0 do LinkedIn Developer App estão prontas para inclusão.')}
            className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3.5 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-500/20 transition-colors shrink-0"
          >
            <Key className="h-3.5 w-3.5" />
            Gerenciar Credenciais OAuth
          </button>
        </div>
      </div>

      {/* Métricas de Company Page do LinkedIn */}
      <div>
        <h3 className="text-sm font-bold text-zinc-200 mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-400" />
          Métricas de Desempenho B2B (LinkedIn Analytics)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-400">Impressões de Posts</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Eye className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-zinc-100">14.8k</p>
            <p className="mt-1 text-[11px] text-emerald-400">+12.1% em relação ao mês anterior</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-400">Visitantes Únicos</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-zinc-100">1.890</p>
            <p className="mt-1 text-[11px] text-zinc-500">Visualizações de Página</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-400">Taxa de Engajamento</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ThumbsUp className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-zinc-100">6.2%</p>
            <p className="mt-1 text-[11px] text-emerald-400">Acima da média da indústria (3.5%)</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-400">Cliques no Botão de Ação</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Globe className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-zinc-100">890</p>
            <p className="mt-1 text-[11px] text-purple-400">Redirecionamentos ao site</p>
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

      {/* Header do Criador do LinkedIn */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <LinkedinIcon className="h-5 w-5 text-blue-400" />
            Publicações da Página Freela Dock no LinkedIn
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Crie posts profissionais, artigos de liderança de pensamento e documentos para o público B2B.
          </p>
        </div>

        <button
          onClick={() => setIsPublisherOpen(!isPublisherOpen)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 hover:from-blue-500 hover:to-indigo-500 transition-all"
        >
          <Plus className="h-4 w-4" />
          {isPublisherOpen ? 'Fechar Criador' : 'Criar Post no LinkedIn'}
        </button>
      </div>

      {/* Editor do LinkedIn com Preview Estilo LinkedIn Card */}
      {isPublisherOpen && (
        <form onSubmit={handleCreateLinkedinPost} className="rounded-2xl border border-blue-500/30 bg-zinc-900/90 p-6 space-y-6 shadow-2xl animate-in fade-in duration-150">
          <div className="border-b border-zinc-800 pb-3">
            <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <LinkedinIcon className="h-5 w-5 text-blue-400" />
              Publicador de Conteúdo B2B do LinkedIn
            </h4>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Campos de formulário */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-2">Formato de Publicação</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPostType('post')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                      postType === 'post'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <ImageIcon className="h-4 w-4" /> Post com Imagem
                  </button>

                  <button
                    type="button"
                    onClick={() => setPostType('article')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                      postType === 'article'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <FileText className="h-4 w-4" /> Artigo de Opinião
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center justify-between">
                  <span>Texto da Publicação *</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{content.length} / 3.000 carac.</span>
                </label>
                <textarea
                  required
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escreva sua mensagem profissional para a comunidade de freelancers e agências..."
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-4 text-xs text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">URL da Imagem ou Capa do Artigo (opcional)</label>
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Agendar Data/Hora (opcional)</label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs text-zinc-100"
                />
              </div>
            </div>

            {/* Live LinkedIn Card Preview */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl border border-zinc-800 bg-zinc-950">
              <p className="text-[11px] font-semibold text-zinc-400 mb-3 flex items-center gap-1">
                <LinkedinIcon className="h-3.5 w-3.5 text-blue-400" /> Pré-visualização do Post no LinkedIn
              </p>

              <div className="w-full max-w-[360px] rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl space-y-3">
                {/* Header do Card LinkedIn */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
                    FD
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-100 truncate">Freela Dock</p>
                    <p className="text-[10px] text-zinc-400">8.120 seguidores • Agora</p>
                  </div>
                  <button type="button" className="text-xs font-semibold text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded">
                    + Seguir
                  </button>
                </div>

                {/* Conteúdo do Post */}
                <p className="text-xs text-zinc-200 line-clamp-4 leading-relaxed font-sans">
                  {content || 'O texto do seu post profissional aparecerá formatado aqui...'}
                </p>

                {/* Mídia */}
                {mediaUrl && (
                  <div className="h-40 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800">
                    <img src={mediaUrl} alt="Preview LinkedIn" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Barra de Reações */}
                <div className="flex items-center justify-between border-t border-zinc-800 pt-2 text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-3.5 w-3.5 text-blue-400" /> Gostei
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5 text-zinc-400" /> Comentar
                  </span>
                  <span className="flex items-center gap-1">
                    <Share2 className="h-3.5 w-3.5 text-zinc-400" /> Compartilhar
                  </span>
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
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500"
            >
              <Send className="h-3.5 w-3.5" />
              {scheduledAt ? 'Agendar no LinkedIn' : 'Publicar no LinkedIn Agora'}
            </button>
          </div>
        </form>
      )}

      {/* Grid de Publicações da Company Page do LinkedIn */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="flex flex-col md:flex-row gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg hover:border-zinc-700 transition-all"
          >
            {post.mediaUrl && (
              <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden bg-zinc-950 shrink-0 border border-zinc-800">
                <img src={post.mediaUrl} alt="Mídia do LinkedIn" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-400 border border-blue-500/20">
                  <LinkedinIcon className="h-3.5 w-3.5" /> {post.type === 'article' ? 'Artigo LinkedIn' : 'Post Company Page'}
                </span>

                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    post.status === 'scheduled'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {post.status === 'scheduled' ? 'Agendado' : 'Publicado'}
                </span>
              </div>

              <p className="text-xs text-zinc-200 leading-relaxed font-sans">{post.content}</p>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-500">
                <div className="flex items-center gap-4">
                  {post.status === 'scheduled' && post.scheduledAt && (
                    <span className="flex items-center gap-1 text-purple-400">
                      <Clock className="h-3 w-3" /> Agendado para {new Date(post.scheduledAt).toLocaleString('pt-BR')}
                    </span>
                  )}
                  {post.status === 'published' && post.publishedAt && (
                    <span className="flex items-center gap-1 text-zinc-400">
                      Publicado em {new Date(post.publishedAt).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-blue-400">
                    <ThumbsUp className="h-3 w-3" /> {post.reactions} reações
                  </span>
                  <span className="flex items-center gap-1 text-zinc-400">
                    <MessageSquare className="h-3 w-3" /> {post.comments} comentários
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Eye className="h-3 w-3" /> {post.impressions} impressões
                  </span>
                </div>

                <button
                  onClick={() => handleDeletePost(post.id)}
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
