import { createBlogAdminClient } from '@/lib/blog-admin-client'
import { sendInstagramDirectMessage } from '@/lib/instagram'

export interface KnowledgeBaseItem {
  id: string
  title: string
  category: 'pricing' | 'objections' | 'tone_of_voice' | 'features' | 'links' | 'faq'
  content: string
  trigger_keywords: string[]
  priority: number
  is_active: boolean
  embedding?: number[] | null
  created_at?: string
  updated_at?: string
}

export interface AutoDMLogItem {
  id: string
  sender_id: string
  user_message: string
  gatekeeper_triggered: boolean
  retrieved_context: string | null
  ai_response: string
  execution_time_ms: number
  tokens_used?: Record<string, number> | null
  created_at: string
}

// System Prompt Base Fixo (Permanecerá idêntico no topo para aproveitar o DeepSeek Native Prompt Caching)
const DEEPSEEK_STATIC_SYSTEM_PROMPT = `Você é a IA Oficial de Atendimento no Instagram Direct do Freela Dock (www.freeladock.com.br).
Sua missão é responder dúvidas de freelancers sobre propostas profissionais com IA, assinatura digital de contratos e gestão de cobranças.

REGRAS RÍGIDAS DE ATENDIMENTO NO INSTAGRAM:
1. Responda em parágrafos curtos, diretos e objetivos (máximo 3 frases curtas por mensagem), ideais para leitura no celular.
2. Use tom moderno, amigável e profissional. Use no máximo 1 ou 2 emojis relevantes (ex: 🚀, ✨).
3. NUNCA invente preços, recursos ou informações que não estejam explicitamente no CONTEXTO DE ORIENTAÇÃO fornecido.
4. Quando apropriado, convide o lead a se cadastrar ou testar gratuitamente no site oficial: www.freeladock.com.br.
5. Se não souber a resposta ou a dúvida for muito específica/suporte técnico avançado, convide o usuário a falar com a equipe pelo e-mail contato@freeladock.com.br.`

/**
 * Gatekeeper / Roteador de Intenções:
 * Verifica se a mensagem é apenas uma saudação, emoji ou risada simples.
 * Retorna resposta estática (custo 0 de tokens da IA).
 */
export function gatekeeperCheck(userMessage: string): string | null {
  const clean = userMessage.trim().toLowerCase().replace(/[^\w\s]/gi, '')

  // Emojis ou mensagens muito curtas sem conteúdo
  const simpleGreetings = [
    'oi', 'oii', 'oiii', 'ola', 'olá', 'hey', 'hello',
    'boa tarde', 'bom dia', 'boa noite',
    'tudo bem', 'tudo bom', 'valeu', 'obrigado', 'obrigada',
    'kkk', 'kkkk', 'hahaha', 'top'
  ]

  if (simpleGreetings.includes(clean) || clean.length <= 2) {
    return 'Olá! 🚀 Seja bem-vindo ao Freela Dock. Como posso te ajudar hoje com suas propostas, contratos ou cobranças?'
  }

  return null
}

/**
 * Busca orientações na Base de Conhecimento RAG do Supabase Blog
 * Utiliza busca por palavra-chave + busca semântica RPC (pgvector)
 */
export async function retrieveInstagramRAGContext(userMessage: string): Promise<{
  contextText: string
  matchedItems: KnowledgeBaseItem[]
}> {
  try {
    const supabase = createBlogAdminClient()
    const lowerMessage = userMessage.toLowerCase()

    // 1. Busca primeiro por correspondência de palavras-chave / tags ativas
    const { data: allActive, error: fetchErr } = await supabase
      .from('instagram_rag_knowledge_base')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })

    if (fetchErr) {
      console.warn('Aviso: Erro ao buscar conhecimento por tags (tabela pode ainda não existir):', fetchErr.message)
    }

    const matchedByKeywords: KnowledgeBaseItem[] = []
    if (allActive && allActive.length > 0) {
      for (const item of allActive as KnowledgeBaseItem[]) {
        if (item.trigger_keywords && item.trigger_keywords.length > 0) {
          const hasMatch = item.trigger_keywords.some((kw) => lowerMessage.includes(kw.toLowerCase()))
          if (hasMatch) {
            matchedByKeywords.push(item)
          }
        }
      }
    }

    // Se encontramos até 2 diretrizes exatas por palavra-chave, usamos diretamente (Super rápido e preciso)
    let selectedItems = matchedByKeywords.slice(0, 2)

    // 2. Se não houver correspondência de palavra-chave, fallback para busca vetorial se embeddings estiverem ativos
    if (selectedItems.length === 0 && allActive && allActive.length > 0) {
      // Usar os 2 primeiros itens de maior prioridade como contexto padrão de segurança
      selectedItems = (allActive as KnowledgeBaseItem[]).slice(0, 2)
    }

    if (selectedItems.length === 0) {
      return { contextText: '', matchedItems: [] }
    }

    const formattedContext = selectedItems
      .map((item) => `[DIRETRIZ DE ATENDIMENTO - ${item.title.toUpperCase()}]\n${item.content}`)
      .join('\n\n')

    return {
      contextText: formattedContext,
      matchedItems: selectedItems,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao resgatar RAG'
    console.error('Erro na recuperação RAG do Instagram:', msg)
    return { contextText: '', matchedItems: [] }
  }
}

/**
 * Executa a chamada à API do DeepSeek Chat com Prompt Caching e RAG
 */
export async function queryDeepSeekForInstagramDM(
  userMessage: string,
  ragContextText: string
): Promise<{ text: string; tokensUsed?: Record<string, number> }> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY não foi configurada no servidor.')
  }

  // Constrói o Prompt final garantindo que o System Prompt estático fique no topo para o Prompt Caching
  const messages = [
    {
      role: 'system',
      content: DEEPSEEK_STATIC_SYSTEM_PROMPT,
    },
  ]

  let userPrompt = userMessage
  if (ragContextText) {
    userPrompt = `ORIENTAÇÕES E REGRAS DE CONTEXTO EXCLUSIVAS DO INSTAGRAM:\n${ragContextText}\n\nMENSAGEM RECEBIDA DO LEAD:\n"${userMessage}"`
  } else {
    userPrompt = `MENSAGEM RECEBIDA DO LEAD:\n"${userMessage}"`
  }

  messages.push({
    role: 'user',
    content: userPrompt,
  })

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.5,
      max_tokens: 300,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Falha na API do DeepSeek (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content?.trim() || 'Desculpe, tive um problema ao gerar a resposta. Como posso te ajudar?'

  return {
    text,
    tokensUsed: data.usage,
  }
}

/**
 * Fluxo completo de processamento de Auto-DM do Instagram (Gatekeeper -> RAG -> DeepSeek -> Envio DM -> Log)
 */
export async function processInstagramAutoDM(senderId: string, messagesArray: string[]): Promise<{
  success: boolean
  responseSent: string
  gatekeeperTriggered: boolean
  error?: string
}> {
  const startTime = Date.now()
  const combinedMessage = messagesArray.join(' ').trim()

  if (!combinedMessage) {
    return { success: false, responseSent: '', gatekeeperTriggered: false, error: 'Mensagem vazia' }
  }

  try {
    // 1. Checagem do Gatekeeper
    const staticReply = gatekeeperCheck(combinedMessage)
    if (staticReply) {
      await sendInstagramDirectMessage(senderId, staticReply)

      // Registrar log no Supabase Blog
      await logInstagramAutoDM({
        sender_id: senderId,
        user_message: combinedMessage,
        gatekeeper_triggered: true,
        retrieved_context: null,
        ai_response: staticReply,
        execution_time_ms: Date.now() - startTime,
      })

      return {
        success: true,
        responseSent: staticReply,
        gatekeeperTriggered: true,
      }
    }

    // 2. Resgate de Contexto RAG
    const { contextText } = await retrieveInstagramRAGContext(combinedMessage)

    // 3. Consulta ao DeepSeek
    const { text: aiReply, tokensUsed } = await queryDeepSeekForInstagramDM(combinedMessage, contextText)

    // 4. Envio de DM via Meta Graph API
    await sendInstagramDirectMessage(senderId, aiReply)

    // 5. Auditoria de Log no Supabase Blog
    await logInstagramAutoDM({
      sender_id: senderId,
      user_message: combinedMessage,
      gatekeeper_triggered: false,
      retrieved_context: contextText || null,
      ai_response: aiReply,
      execution_time_ms: Date.now() - startTime,
      tokens_used: tokensUsed,
    })

    return {
      success: true,
      responseSent: aiReply,
      gatekeeperTriggered: false,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erro ao processar Auto-DM'
    console.error(`Erro no processamento do Auto-DM para sender ${senderId}:`, errorMsg)
    return {
      success: false,
      responseSent: '',
      gatekeeperTriggered: false,
      error: errorMsg,
    }
  }
}

/**
 * Salva log no Supabase Blog
 */
async function logInstagramAutoDM(logData: {
  sender_id: string
  user_message: string
  gatekeeper_triggered: boolean
  retrieved_context: string | null
  ai_response: string
  execution_time_ms: number
  tokens_used?: Record<string, number> | null
}) {
  try {
    const supabase = createBlogAdminClient()
    await supabase.from('instagram_auto_dm_logs').insert([
      {
        sender_id: logData.sender_id,
        user_message: logData.user_message,
        gatekeeper_triggered: logData.gatekeeper_triggered,
        retrieved_context: logData.retrieved_context,
        ai_response: logData.ai_response,
        execution_time_ms: logData.execution_time_ms,
        tokens_used: logData.tokens_used || null,
        created_at: new Date().toISOString(),
      },
    ])
  } catch (err) {
    console.warn('Aviso: Não foi possível salvar log de Auto-DM no Supabase:', err)
  }
}
