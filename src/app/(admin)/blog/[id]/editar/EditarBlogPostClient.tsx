'use client'

import { useState, useRef, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ImagePlus, Loader2 } from 'lucide-react'
import { updatePost, uploadCoverImage } from '@/app/actions/blog'
import type { Post } from '@/lib/blog-admin-client'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

export default function EditarBlogPostClient({ post }: { post: Post }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [content, setContent] = useState(post.content_md)
  const [coverUrl, setCoverUrl] = useState(post.cover_image_url ?? '')
  type UploadPhase = 'idle' | 'uploading' | 'processing' | 'done'
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [slug, setSlug] = useState(post.slug)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (uploadPhase === 'processing') {
      setProcessingProgress(0)
      interval = setInterval(() => {
        setProcessingProgress(prev => (prev >= 95 ? prev : prev + Math.floor(Math.random() * 15) + 5))
      }, 100)
    }
    return () => clearInterval(interval)
  }, [uploadPhase])

  function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadPhase('uploading')
    setUploadProgress(0)
    setError(null)

    const fd = new FormData()
    fd.append('file', file)

    const xhr = new XMLHttpRequest()
    
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100)
        setUploadProgress(percent)
        if (percent >= 100) {
          setUploadPhase('processing')
        }
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText)
          if (result.error) {
            setError(result.error)
            setUploadPhase('idle')
          } else {
            setProcessingProgress(100)
            setTimeout(() => {
              setCoverUrl(result.url)
              setUploadPhase('done')
            }, 300)
          }
        } catch {
          setError('Erro inesperado no servidor.')
          setUploadPhase('idle')
        }
      } else {
        try {
          const result = JSON.parse(xhr.responseText)
          setError(result.error || 'Erro ao enviar a imagem.')
        } catch {
          setError('Erro ao enviar a imagem.')
        }
        setUploadPhase('idle')
      }
    }

    xhr.onerror = () => {
      setError('Erro de conexão ao enviar a imagem.')
      setUploadPhase('idle')
    }

    xhr.open('POST', '/api/upload-image')
    xhr.send(fd)
  }

  function handleSubmit() {
    setError(null)
    setSuccess(false)
    const form = document.getElementById('edit-form') as HTMLFormElement
    const fd = new FormData(form)
    fd.set('content_md', content)
    fd.set('cover_image_url', coverUrl)
    fd.set('slug', slug)

    startTransition(async () => {
      const result = await updatePost(post.id, fd)
      if ('error' in result) {
        setError(result.error)
      } else {
        setSuccess(true)
        router.refresh()
      }
    })
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Editar Post</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Status:{' '}
            <span className={`font-medium ${post.status === 'published' ? 'text-emerald-400' : 'text-zinc-400'}`}>
              {post.status === 'published' ? 'Publicado' : post.status === 'draft' ? 'Rascunho' : 'Arquivado'}
            </span>
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 rounded-lg border border-emerald-800 bg-emerald-950 px-4 py-3 text-sm text-emerald-300">
          Post atualizado com sucesso!
        </div>
      )}

      <form id="edit-form" className="space-y-6">
        {/* Imagem de capa */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Imagem de Capa</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex h-48 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-800/50 transition-all hover:border-indigo-500 hover:bg-zinc-800/80 overflow-hidden"
          >
            {coverUrl && uploadPhase !== 'uploading' && uploadPhase !== 'processing' ? (
              <div className="relative h-full w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverUrl} alt="Capa" className="h-full w-full rounded-xl object-cover" />
                <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-md bg-emerald-600/90 px-2.5 py-1 text-xs font-medium text-white shadow-lg backdrop-blur-sm border border-emerald-500/30">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
                  WebP Otimizado
                </div>
              </div>
            ) : uploadPhase === 'uploading' || uploadPhase === 'processing' ? (
              <div className="flex w-full max-w-xs flex-col gap-4 text-indigo-400 px-6">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="text-sm font-medium text-indigo-300">
                    {uploadPhase === 'uploading' ? 'Enviando arquivo...' : 'Comprimindo e Otimizando...'}
                  </span>
                </div>
                
                {/* Barras de progresso */}
                <div className="space-y-3 w-full">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>Upload</span>
                      <span className={uploadProgress === 100 ? 'text-emerald-400 font-medium' : ''}>{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div className="h-full bg-indigo-500 transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>Conversão WebP</span>
                      <span className={processingProgress === 100 ? 'text-emerald-400 font-medium' : ''}>
                        {uploadPhase === 'processing' ? `${processingProgress}%` : '0%'}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div className="h-full bg-emerald-500 transition-all duration-300 ease-out" style={{ width: uploadPhase === 'processing' ? `${processingProgress}%` : '0%' }} />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
                <ImagePlus className="h-8 w-8" />
                <span className="text-sm font-medium">Clique para trocar imagem</span>
                <span className="text-xs opacity-75">JPG, PNG, WebP — máx. 5MB</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            className="hidden"
            onChange={handleCoverUpload}
          />
        </div>

        {/* Título */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-zinc-300 mb-1">
            Título <span className="text-red-400">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={post.title}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
          />
        </div>

        {/* Slug */}
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-zinc-300 mb-1">Slug (URL)</label>
          <input
            id="slug"
            name="slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 font-mono text-zinc-100 outline-none focus:border-indigo-500 text-sm"
          />
          <p className="mt-1 text-xs text-zinc-500">
            freeladock.com.br/blog/<span className="text-zinc-300">{slug}</span>
          </p>
        </div>

        {/* Excerpt */}
        <div>
          <label htmlFor="excerpt" className="block text-sm font-medium text-zinc-300 mb-1">Resumo</label>
          <textarea
            id="excerpt"
            name="excerpt"
            rows={2}
            defaultValue={post.excerpt ?? ''}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500 text-sm resize-none"
          />
        </div>

        {/* Editor */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Conteúdo <span className="text-red-400">*</span>
          </label>
          <div data-color-mode="dark">
            <MDEditor value={content} onChange={(v) => setContent(v ?? '')} height={500} preview="live" />
          </div>
        </div>

        {/* SEO */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-4">
          <p className="text-sm font-semibold text-zinc-300">SEO / Meta</p>
          <div>
            <label htmlFor="seo_title" className="block text-xs font-medium text-zinc-400 mb-1">SEO Title</label>
            <input id="seo_title" name="seo_title" type="text" maxLength={60} defaultValue={post.seo_title ?? ''}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 outline-none focus:border-indigo-500 text-sm" />
          </div>
          <div>
            <label htmlFor="seo_description" className="block text-xs font-medium text-zinc-400 mb-1">Meta Description</label>
            <textarea id="seo_description" name="seo_description" rows={2} maxLength={160} defaultValue={post.seo_description ?? ''}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 outline-none focus:border-indigo-500 text-sm resize-none" />
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-3 pt-2">
          <button type="button" onClick={() => router.push('/blog')}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-700">
            Cancelar
          </button>
          <button type="button" onClick={handleSubmit} disabled={isPending || uploadPhase === 'uploading' || uploadPhase === 'processing'}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 flex items-center gap-2">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar Alterações
          </button>
        </div>
      </form>
    </div>
  )
}
