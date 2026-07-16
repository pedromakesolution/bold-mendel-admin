/**
 * blog-admin-client.ts
 *
 * Cliente Supabase com SERVICE_ROLE para o projeto exclusivo do Blog.
 * Bypassa o RLS para permitir acesso total à tabela posts (drafts, archived, etc.)
 *
 * ⚠️  SERVER ONLY — nunca importar em Client Components.
 *     Usar apenas em Server Actions e Route Handlers.
 */
import { createClient } from '@supabase/supabase-js'

export function createBlogAdminClient() {
  const url = process.env.NEXT_PUBLIC_BLOG_SUPABASE_URL
  const serviceKey = process.env.BLOG_SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Variáveis de ambiente do Blog Admin não configuradas.\n' +
      'Necessário: NEXT_PUBLIC_BLOG_SUPABASE_URL, BLOG_SUPABASE_SERVICE_ROLE_KEY'
    )
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export interface Post {
  id: string
  slug: string
  title: string
  content_md: string
  excerpt: string | null
  cover_image_url: string | null
  seo_title: string | null
  seo_description: string | null
  status: 'draft' | 'published' | 'archived'
  published_at: string | null
  created_at: string
  updated_at: string | null
  author_id: string | null
  google_index_status: string | null
  google_index_checked_at: string | null
}
