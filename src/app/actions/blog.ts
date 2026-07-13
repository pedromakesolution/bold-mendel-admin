'use server'

import { revalidatePath } from 'next/cache'
import { createBlogAdminClient } from '@/lib/blog-admin-client'
import { requireAdminSession } from '@/lib/auth'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function revalidateBlog(slug?: string) {
  revalidatePath('/blog')
  if (slug) revalidatePath(`/blog/${slug}`)
}

// ─── Upload de imagem de capa ─────────────────────────────────────────────────

export async function uploadCoverImage(formData: FormData): Promise<{ url: string } | { error: string }> {
  await requireAdminSession()
  const supabase = createBlogAdminClient()

  const file = formData.get('file') as File | null
  if (!file) return { error: 'Nenhum arquivo enviado.' }

  const ext = file.name.split('.').pop()
  const filename = `covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from('blog-assets')
    .upload(filename, file, { contentType: file.type, upsert: false })

  if (error) return { error: error.message }

  const { data: { publicUrl } } = supabase.storage
    .from('blog-assets')
    .getPublicUrl(filename)

  return { url: publicUrl }
}

// ─── Criar post ──────────────────────────────────────────────────────────────

export async function createPost(formData: FormData): Promise<{ id: string } | { error: string }> {
  const session = await requireAdminSession()
  const supabase = createBlogAdminClient()

  const title = (formData.get('title') as string).trim()
  const rawSlug = (formData.get('slug') as string).trim()
  const slug = rawSlug || generateSlug(title)
  const publish = formData.get('publish') === 'true'

  const payload = {
    title,
    slug,
    content_md: (formData.get('content_md') as string) || '',
    excerpt: (formData.get('excerpt') as string) || null,
    cover_image_url: (formData.get('cover_image_url') as string) || null,
    seo_title: (formData.get('seo_title') as string) || null,
    seo_description: (formData.get('seo_description') as string) || null,
    author_id: session.user.id,
    status: publish ? 'published' : 'draft',
    published_at: publish ? new Date().toISOString() : null,
  }

  const { data, error } = await supabase
    .from('posts')
    .insert(payload)
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidateBlog(slug)
  return { id: data.id }
}

// ─── Atualizar post ───────────────────────────────────────────────────────────

export async function updatePost(id: string, formData: FormData): Promise<{ success: true } | { error: string }> {
  await requireAdminSession()
  const supabase = createBlogAdminClient()

  const title = (formData.get('title') as string).trim()
  const rawSlug = (formData.get('slug') as string).trim()
  const slug = rawSlug || generateSlug(title)

  const payload = {
    title,
    slug,
    content_md: (formData.get('content_md') as string) || '',
    excerpt: (formData.get('excerpt') as string) || null,
    cover_image_url: (formData.get('cover_image_url') as string) || null,
    seo_title: (formData.get('seo_title') as string) || null,
    seo_description: (formData.get('seo_description') as string) || null,
  }

  const { error } = await supabase
    .from('posts')
    .update(payload)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidateBlog(slug)
  return { success: true }
}

// ─── Publicar post (void — compatível com form action) ─────────────────────────
// Para uso programático com retorno tipado, chame o Supabase diretamente.

export async function publishPost(id: string, slug: string): Promise<void> {
  await requireAdminSession()
  const supabase = createBlogAdminClient()

  const { error } = await supabase
    .from('posts')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('[publishPost]', error.message)
    return
  }

  revalidateBlog(slug)
}

// ─── Arquivar post (void — compatível com form action) ──────────────────────────

export async function archivePost(id: string, slug: string): Promise<void> {
  await requireAdminSession()
  const supabase = createBlogAdminClient()

  const { error } = await supabase
    .from('posts')
    .update({ status: 'archived' })
    .eq('id', id)

  if (error) {
    console.error('[archivePost]', error.message)
    return
  }

  revalidateBlog(slug)
}

// ─── Excluir post (void — compatível com form action) ──────────────────────────

export async function deletePost(id: string, slug: string): Promise<void> {
  await requireAdminSession()
  const supabase = createBlogAdminClient()

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[deletePost]', error.message)
    return
  }

  revalidateBlog(slug)
}
