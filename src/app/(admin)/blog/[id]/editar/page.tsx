import { notFound } from 'next/navigation'
import { createBlogAdminClient } from '@/lib/blog-admin-client'
import EditarBlogPostClient from './EditarBlogPostClient'

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

  return <EditarBlogPostClient post={post} />
}
