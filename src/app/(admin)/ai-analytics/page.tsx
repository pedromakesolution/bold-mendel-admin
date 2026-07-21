import React from 'react'
import { getAILogs, getAIStats, getDeepSeekBalance } from '@/app/actions/ai-analytics'
import { Activity, Coins, DatabaseZap, Network, CheckCircle2, XCircle, Wallet } from 'lucide-react'
import { RefreshButton } from './RefreshButton'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'IA Analytics | Admin Portal',
}

export default async function AIAnalyticsPage() {
  const [logsRes, statsRes, balanceRes] = await Promise.all([
    getAILogs(50),
    getAIStats(),
    getDeepSeekBalance()
  ])

  const stats = statsRes.data || {
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    totalCacheHits: 0,
    totalCacheMisses: 0,
    cacheHitRatio: 0,
    successCount: 0,
    errorCount: 0
  }

  const logs = logsRes.data || []

  return (
    <div className="flex h-full flex-col">
      <header className="flex-none flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 p-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Network className="h-6 w-6 text-indigo-400" />
            Inteligência Artificial (Analytics)
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Monitore o consumo de tokens, custos e desempenho do cache das APIs de IA.
          </p>
        </div>
        <RefreshButton />
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* DeepSeek Balance Card */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent p-6 backdrop-blur-xl transition-all hover:bg-amber-500/10">
            <div className="absolute -right-4 -top-4 rounded-full bg-amber-500/10 p-8 blur-2xl" />
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-500/80">Saldo DeepSeek (Total)</p>
                <p className="text-2xl font-bold text-amber-400">
                  {balanceRes.data ? `$${balanceRes.data.totalBalance}` : 'Erro'}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-amber-500/60">
              <span>Plataforma + AGOS</span>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-xl transition-all hover:bg-zinc-800/50">
            <div className="absolute -right-4 -top-4 rounded-full bg-indigo-500/10 p-8 blur-2xl" />
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-400">Total de Requisições</p>
                <p className="text-2xl font-bold text-zinc-100">{stats.totalRequests}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> {stats.successCount} Sucesso
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <XCircle className="h-3 w-3" /> {stats.errorCount} Erro
              </span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-xl transition-all hover:bg-zinc-800/50">
            <div className="absolute -right-4 -top-4 rounded-full bg-emerald-500/10 p-8 blur-2xl" />
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <Coins className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-400">Custo Acumulado</p>
                <p className="text-2xl font-bold text-zinc-100">
                  ${stats.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                </p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-xl transition-all hover:bg-zinc-800/50">
            <div className="absolute -right-4 -top-4 rounded-full bg-blue-500/10 p-8 blur-2xl" />
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                <DatabaseZap className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-400">Total Tokens</p>
                <p className="text-2xl font-bold text-zinc-100">
                  {stats.totalTokens.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-xl transition-all hover:bg-zinc-800/50">
            <div className="absolute -right-4 -top-4 rounded-full bg-purple-500/10 p-8 blur-2xl" />
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
                <DatabaseZap className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-400">Prompt Cache Hit</p>
                <p className="text-2xl font-bold text-zinc-100">
                  {stats.cacheHitRatio.toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
              <span>{stats.totalCacheHits.toLocaleString('pt-BR')} hits</span>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-xl overflow-hidden">
          <div className="border-b border-zinc-800/60 p-5">
            <h2 className="text-lg font-semibold text-zinc-100">Histórico de Chamadas (Recentes)</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="bg-zinc-800/30 text-xs uppercase text-zinc-500 border-b border-zinc-800/60">
                <tr>
                  <th className="px-6 py-4 font-medium">Data</th>
                  <th className="px-6 py-4 font-medium">Provedor/Modelo</th>
                  <th className="px-6 py-4 font-medium text-right">Tokens</th>
                  <th className="px-6 py-4 font-medium text-center">Cache Hit</th>
                  <th className="px-6 py-4 font-medium text-right">Custo Estimado</th>
                  <th className="px-6 py-4 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                      Nenhuma chamada registrada no momento.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('pt-BR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit', second: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-zinc-200 capitalize">{log.provider || 'Desconhecido'}</span>
                          <span className="text-xs text-zinc-500">{log.model || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-medium text-zinc-200">{log.total_tokens?.toLocaleString('pt-BR') || 0}</span>
                          <span className="text-xs text-zinc-500">P: {log.prompt_tokens || 0} / C: {log.completion_tokens || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          (log.cache_hit_tokens || 0) > 0 ? 'bg-purple-500/10 text-purple-400' : 'bg-zinc-800 text-zinc-500'
                        }`}>
                          {log.cache_hit_tokens || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-zinc-300">
                        ${(log.estimated_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {log.status === 'success' ? (
                          <span className="inline-flex items-center justify-center rounded-full bg-emerald-500/10 p-1 text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center rounded-full bg-rose-500/10 p-1 text-rose-400" title={log.error_message || 'Erro'}>
                            <XCircle className="h-4 w-4" />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
