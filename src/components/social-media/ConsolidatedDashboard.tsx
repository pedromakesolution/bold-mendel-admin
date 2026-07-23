'use client'

import {
  Users,
  Mail,
  Zap,
  TrendingUp,
  Share2,
  Calendar,
  Eye,
  Heart,
  MousePointer,
  Sparkles,
} from 'lucide-react'

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

interface ConsolidatedDashboardProps {
  totalSubscribers: number
  emailCredits: number | null
  newslettersCount: number
}

export default function ConsolidatedDashboard({
  totalSubscribers,
  emailCredits,
  newslettersCount,
}: ConsolidatedDashboardProps) {
  return (
    <div className="space-y-8">
      {/* Banner de Destaque Unificado */}
      <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-zinc-900 via-indigo-950/40 to-purple-950/30 p-6 sm:p-8 shadow-xl backdrop-blur-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" />
              Painel Geral Consolidado — Freela Dock
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
              Desempenho Unificado de Marketing & Comunicação
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Acompanhe a audiência acumulada, engajamento e métricas cruzadas de E-mail Marketing (Brevo), Instagram e LinkedIn em um único lugar.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-center">
              <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Alcance Global</p>
              <p className="text-xl font-bold text-indigo-400 mt-0.5">25.3k</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-center">
              <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Engajamento</p>
              <p className="text-xl font-bold text-emerald-400 mt-0.5">5.4%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Métricas Principais Consolidadas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-400">Contatos E-mail (Brevo)</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-zinc-100">{totalSubscribers}</p>
          <p className="mt-1 text-[11px] text-zinc-500">Listas ativas na Brevo</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-400">Seguidores Instagram</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <InstagramIcon className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-zinc-100">12.4k</p>
          <p className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> +8.4% este mês
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-400">Seguidores LinkedIn</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <LinkedinIcon className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-zinc-100">8.1k</p>
          <p className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> +12.1% este mês
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-400">Saldo de E-mails Brevo</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-zinc-100">
            {emailCredits !== null ? emailCredits.toLocaleString('pt-BR') : 'Ativo'}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">Créditos SMTP disponíveis</p>
        </div>
      </div>

      {/* Visão de Canais e Desempenho Relativo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card Brevo */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-100">E-Mail Mkt (Brevo)</h3>
                <p className="text-[11px] text-zinc-500">E-mails e Automações</p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Ativo
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-zinc-300">
              <span>Newsletters Criadas:</span>
              <strong className="text-zinc-100">{newslettersCount}</strong>
            </div>
            <div className="flex items-center justify-between text-zinc-300">
              <span>Taxa Média de Abertura:</span>
              <strong className="text-emerald-400 font-bold">42.5%</strong>
            </div>
            <div className="flex items-center justify-between text-zinc-300">
              <span>Taxa de Cliques (CTR):</span>
              <strong className="text-purple-400 font-bold">8.1%</strong>
            </div>
          </div>
        </div>

        {/* Card Instagram */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
                <InstagramIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-100">Instagram API</h3>
                <p className="text-[11px] text-zinc-500">@boldmendel.oficial</p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Pronto
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-zinc-300">
              <span>Alcance Semanal:</span>
              <strong className="text-zinc-100">18.2k pessoas</strong>
            </div>
            <div className="flex items-center justify-between text-zinc-300">
              <span>Visitas ao Perfil:</span>
              <strong className="text-pink-400 font-bold">1.240</strong>
            </div>
            <div className="flex items-center justify-between text-zinc-300">
              <span>Publicações (Feed/Reels):</span>
              <strong className="text-zinc-100">48 posts</strong>
            </div>
          </div>
        </div>

        {/* Card LinkedIn */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <LinkedinIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-100">LinkedIn Company</h3>
                <p className="text-[11px] text-zinc-500">Freela Dock</p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Pronto
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-zinc-300">
              <span>Impressões de Artigos:</span>
              <strong className="text-zinc-100">14.8k</strong>
            </div>
            <div className="flex items-center justify-between text-zinc-300">
              <span>Engajamento B2B:</span>
              <strong className="text-blue-400 font-bold">6.2%</strong>
            </div>
            <div className="flex items-center justify-between text-zinc-300">
              <span>Cliques no Site:</span>
              <strong className="text-zinc-100">890 cliques</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
