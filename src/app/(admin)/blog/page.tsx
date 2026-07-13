import Link from 'next/link'
import { Plus, Pencil, Archive, Globe } from 'lucide-react'
import { createBlogAdminClient, type Post } from '@/lib/blog-admin-client'
import { publishPost, archivePost } from '@/app/actions/blog'

// Revalida a listagem a cada 60s no admin para capturar mudanças externas
export const revalidate = 60

const STATUS_BADGE: Record<Post['status'], { label: string; className: string }> = {
  draft:     { label: 'Rascunho',  className: 'bg-zinc-700 text-zinc-300'   },
  published: { label: 'Publicado', className: 'bg-emerald-900 text-emerald-300' },
  archived:  { label: 'Arquivado', className: 'bg-yellow-900 text-yellow-300'   },
}

export default async function BlogListPage() {
  const supabase = createBlogAdminClient()
  const { data: posts } = await supabase
    .from('posts')
    .select('id, slug, title, status, published_at, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 md:p-8">
      {/* Cabeçalho */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Blog</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {posts?.length ?? 0} post{posts?.length !== 1 ? 's' : ''} no total
          </p>
        </div>
        <Link
          href="/blog/novo"
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          Novo Post
        </Link>
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        {!posts?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <p className="text-lg">Nenhum post criado ainda.</p>
            <Link href="/blog/novo" className="mt-3 text-sm text-indigo-400 hover:underline">
              Criar primeiro post →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3 font-medium">Título</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Publicado em</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {posts.map((post) => {
                const badge = STATUS_BADGE[post.status as Post['status']]
                return (
                  <tr key={post.id} className="group transition-colors hover:bg-zinc-800/50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-zinc-100 line-clamp-1">{post.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400">
                        {post.slug}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {post.published_at
                        ? new Date(post.published_at).toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* Editar */}
                        <Link
                          href={`/blog/${post.id}/editar`}
                          title="Editar"
                          className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>

                        {/* Publicar (só se for draft) */}
                        {post.status === 'draft' && (
                          <form action={publishPost.bind(null, post.id, post.slug)}>
                            <button
                              type="submit"
                              title="Publicar"
                              className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-emerald-900/50 hover:text-emerald-400"
                            >
                              <Globe className="h-4 w-4" />
                            </button>
                          </form>
                        )}

                        {/* Arquivar (só se não for archived) */}
                        {post.status !== 'archived' && (
                          <form action={archivePost.bind(null, post.id, post.slug)}>
                            <button
                              type="submit"
                              title="Arquivar"
                              className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-yellow-900/50 hover:text-yellow-400"
                            >
                              <Archive className="h-4 w-4" />
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
