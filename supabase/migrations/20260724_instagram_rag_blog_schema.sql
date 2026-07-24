-- ============================================================
-- MIGRAÇÃO RAG INSTAGRAM STUDIO — PROJETO SUPABASE BLOG (xghvuededwbxmyblqlud)
-- ============================================================

-- 1. Habilitar a extensão pgvector para busca semântica
create extension if not exists vector;

-- 2. Tabela da Base de Conhecimento RAG do Instagram
create table if not exists instagram_rag_knowledge_base (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('pricing', 'objections', 'tone_of_voice', 'features', 'links', 'faq')),
  content text not null,
  trigger_keywords text[] default '{}',
  priority int default 1,
  is_active boolean default true,
  embedding vector(1536),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index para otimização de busca vetorial IVFFlat
create index if not exists idx_instagram_rag_embedding 
  on instagram_rag_knowledge_base 
  using ivfflat (embedding vector_cosine_ops) 
  with (lists = 100);

-- 3. Tabela de Buffer para Processamento Assíncrono e Debounce do Webhook da Meta
create table if not exists instagram_dm_buffer (
  id uuid primary key default gen_random_uuid(),
  sender_id text not null,
  message_id text,
  message_text text not null,
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  created_at timestamptz default now()
);

create index if not exists idx_instagram_dm_buffer_sender_status 
  on instagram_dm_buffer (sender_id, status);

-- 4. Tabela de Logs e Auditoria Completa do Auto-DM
create table if not exists instagram_auto_dm_logs (
  id uuid primary key default gen_random_uuid(),
  sender_id text not null,
  user_message text not null,
  gatekeeper_triggered boolean default false,
  retrieved_context text,
  ai_response text not null,
  execution_time_ms int,
  tokens_used jsonb,
  created_at timestamptz default now()
);

-- 5. Função RPC para Busca Vetorial Semântica com Corte por Threshold
create or replace function match_instagram_rag (
  query_embedding vector(1536),
  match_threshold float default 0.78,
  match_count int default 2
)
returns table (
  id uuid,
  title text,
  category text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    id,
    title,
    category,
    content,
    1 - (instagram_rag_knowledge_base.embedding <=> query_embedding) as similarity
  from instagram_rag_knowledge_base
  where is_active = true
    and 1 - (instagram_rag_knowledge_base.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;

-- 6. Inserção de Dados Iniciais (Orientações Padrão de Exemplo)
insert into instagram_rag_knowledge_base (title, category, content, trigger_keywords, priority)
values
  (
    'Valores e Planos do Freela Dock',
    'pricing',
    '• O Freela Dock possui um plano 100% gratuito para novos freelancers começarem a enviar propostas profissionais e emitir contratos.\n• O plano Pro custa R$ 29,90/mês ou R$ 299/ano com propostas ilimitadas e assinatura digital ilimitada.\n• Nunca ofereça descontos adicionais além dos divulgados no site oficial www.freeladock.com.br.',
    array['preço', 'valor', 'quanto custa', 'plano', 'mensalidade', 'pago'],
    10
  ),
  (
    'Assinatura Digital de Contratos',
    'features',
    '• Todos os contratos gerados pelo Freela Dock possuem validade jurídica (MP 2.200-2/2001).\n• O cliente do freelancer assina no celular ou computador com 1 clique, sem precisar de cadastro prévio.\n• Notificações e lembretes de cobrança são enviados automaticamente via WhatsApp e e-mail.',
    array['contrato', 'assinatura', 'juridico', 'validade', 'assinar'],
    8
  ),
  (
    'Tom de Voz no Instagram Direct',
    'tone_of_voice',
    '• Seja extremamente simpático, moderno e direto ao ponto.\n• Use parágrafos curtos (1 a 3 frases) adequados para leitura no celular.\n• Use no máximo 1 ou 2 emojis relevantes (ex: 🚀, ✨).\n• Finalize sempre com uma chamada para ação convidando para experimentar grátis em www.freeladock.com.br.',
    array['tom', 'estilo', 'regras'],
    9
  )
on conflict do nothing;
