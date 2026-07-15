import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { createBlogAdminClient } from '@/lib/blog-admin-client'
import { requireAdminSession } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    // Apenas admins logados podem fazer upload
    await requireAdminSession()
    
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 })
    }

    const supabase = createBlogAdminClient()
    
    const arrayBuffer = await file.arrayBuffer()
    const originalBuffer = Buffer.from(arrayBuffer)
    
    // Converte para WebP e comprime
    const buffer = await sharp(originalBuffer)
      .webp({ quality: 80 })
      .toBuffer()

    const mimeType = 'image/webp'
    const randomStr = Math.random().toString(36).slice(2)
    const filename = `covers/${Date.now()}-${randomStr}.webp`

    // Converte o Buffer do Node para um Blob padrão da Web API.
    // Isso evita que o Next.js/Supabase crie um arquivo corrompido de 0 bytes durante o fetch.
    const fileBlob = new Blob([buffer], { type: mimeType })

    const { error } = await supabase.storage
      .from('blog-assets')
      .upload(filename, fileBlob, { contentType: mimeType, upsert: false })

    if (error) {
      console.error('[UploadImage API] Supabase error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('blog-assets')
      .getPublicUrl(filename)

    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    console.error('[UploadImage API] Erro ao processar:', err)
    return NextResponse.json({ error: 'Falha ao processar a imagem.' }, { status: 500 })
  }
}
