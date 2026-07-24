import { NextRequest, NextResponse } from 'next/server'
import { createBlogAdminClient } from '@/lib/blog-admin-client'
import { processInstagramAutoDM } from '@/lib/instagram-rag'

const VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || 'freeladock_instagram_verify_token_2026'

/**
 * GET: Verificação do Webhook da Meta Developer API
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook do Instagram verificado com sucesso pela Meta!')
      return new NextResponse(challenge, { status: 200 })
    } else {
      return new NextResponse('Forbidden: Token de verificação inválido.', { status: 403 })
    }
  }

  return NextResponse.json({ status: 'Instagram Webhook Endpoint Active' })
}

/**
 * POST: Recebimento de Mensagens Diretas (DMs) do Instagram em Tempo Real
 * Importante: Responde HTTP 200 OK em < 100ms e processa em background!
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Processa a estrutura de eventos da Meta Graph API
    if (body.object === 'instagram' || body.object === 'page') {
      const entries = body.entry || []

      for (const entry of entries) {
        const messagingList = entry.messaging || []

        for (const messagingEvent of messagingList) {
          const senderId = messagingEvent.sender?.id
          const messageText = messagingEvent.message?.text

          if (senderId && messageText) {
            console.log(`📩 Nova DM recebida de ${senderId}: "${messageText}"`)

            // 1. Salvar no Buffer do Supabase Blog para Debounce e Auditoria
            try {
              const supabase = createBlogAdminClient()
              await supabase.from('instagram_dm_buffer').insert([
                {
                  sender_id: senderId,
                  message_id: messagingEvent.message?.mid || null,
                  message_text: messageText,
                  status: 'pending',
                  created_at: new Date().toISOString(),
                },
              ])
            } catch (bufErr) {
              console.warn('Aviso: Falha ao gravar no instagram_dm_buffer (tabela pode estar ausente):', bufErr)
            }

            // 2. Disparar o processamento em background (Não-bloqueante)
            // Em ambiente Serverless / Next.js, executamos a promise de forma assíncrona sem aguardar o await
            setImmediate(async () => {
              try {
                await processInstagramAutoDM(senderId, [messageText])
              } catch (asyncErr) {
                console.error('Erro no processamento assíncrono do Auto-DM:', asyncErr)
              }
            })
          }
        }
      }
    }

    // Retorna HTTP 200 OK instantaneamente para a Meta em < 100ms
    return NextResponse.json({ status: 'RECEIVED' }, { status: 200 })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erro no webhook'
    console.error('Erro ao processar requisição do Webhook do Instagram:', errorMsg)
    // Retorna 200 OK mesmo em erro para não desativar o webhook na Meta
    return NextResponse.json({ status: 'ERROR_HANDLED', error: errorMsg }, { status: 200 })
  }
}
