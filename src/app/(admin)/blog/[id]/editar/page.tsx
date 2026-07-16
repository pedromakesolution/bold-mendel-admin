import { notFound } from 'next/navigation'
import { createBlogAdminClient } from '@/lib/blog-admin-client'
import EditarBlogPostClient from './EditarBlogPostClient'
import { getPostMetrics } from '@/lib/google-search-console'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarBlogPostPage({ params }: Props) {
  const { id } = await params
  const supabase = createBlogAdminClient()

  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !post) notFound()

  let metrics = null
  if (post.status === 'published') {
    metrics = await getPostMetrics(post.slug)
  }

  return <EditarBlogPostClient post={post} metrics={metrics} />
}
