-- Migration: Tabela de Newsletters para o Supabase (Projeto Blog)
-- Executar no SQL Editor do Supabase (https://xghvuededwbxmyblqlud.supabase.co)

CREATE TABLE IF NOT EXISTS newsletters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  sender_name TEXT NOT NULL DEFAULT 'Bold Mendel',
  sender_email TEXT NOT NULL DEFAULT 'contato@freeladock.com.br',
  content_markdown TEXT,
  content_html TEXT NOT NULL,
  brevo_campaign_id BIGINT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'sent', 'cancelled')) DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  stats JSONB DEFAULT '{"open_rate": 0, "click_rate": 0, "delivered": 0, "unique_views": 0, "unsubscribes": 0}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para buscas rápidas por status e datas
CREATE INDEX IF NOT EXISTS idx_newsletters_status ON newsletters(status);
CREATE INDEX IF NOT EXISTS idx_newsletters_created_at ON newsletters(created_at DESC);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_newsletters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_newsletters_updated_at ON newsletters;
CREATE TRIGGER trigger_update_newsletters_updated_at
  BEFORE UPDATE ON newsletters
  FOR EACH ROW
  EXECUTE FUNCTION update_newsletters_updated_at();

-- Habilitar RLS (opcional se acessado via SERVICE_ROLE_KEY no admin)
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;

-- Política permissiva para Service Role
CREATE POLICY "Service Role tem acesso total a newsletters"
  ON newsletters
  FOR ALL
  USING (true)
  WITH CHECK (true);
