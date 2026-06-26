# Plano de Implementação: Portal Administrativo Freela Dock

**Objetivo:** Desenvolver o novo Portal Administrativo do Freela Dock focando em eficiência, manutenção e segurança de dados a longo prazo, respeitando as limitações do tier gratuito do Supabase.

## 1. Arquitetura Geral
* **Stack:** Next.js (App Router), Tailwind CSS, Shadcn UI (Componentes), Tremor (Gráficos), Supabase Client.
* **Infraestrutura:** Cloudflare Pages (Deploy isolado em subdomínio `admin.freeladock.com.br`).
* **Segurança:** Cloudflare Access (Zero Trust) na borda + RLS otimizado via Functions (Supabase) + Server Actions (Next.js).

## 2. Fases de Desenvolvimento

### Fase 1: Estrutura e Segurança (Setup DB Otimizado)
* Configurar novo repositório/projeto Next.js.
* Implementar Cloudflare Access na URL para bloqueio perimetral de não-autorizados.
* Criar a tabela `user_roles` no Supabase (colunas: `id`, `user_id`, `role`, `created_at`).
* **Criar Índice no Banco:** Adicionar um index na coluna `user_id` da tabela `user_roles` para buscas instantâneas (`CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);`).
* **Otimização de RLS:** Criar uma function `is_super_admin()` com `SECURITY DEFINER` no PostgreSQL para realizar a checagem da role sem gerar gargalos de recursão ou lentidão em queries complexas. Configurar as policies utilizando esta função.

### Fase 2: Gestão de Usuários e Acessos
* Criar Dashboard de usuários com recursos de busca e filtros.
* Desenvolver Server Actions para interações de gestão: Visualizar perfil, trocar status da conta (Ativo/Inativo) e reset de senha.
* **Diretriz Obrigatória:** O uso de operações `DELETE` no banco de dados está estritamente proibido para manter a integridade relacional. Inativações serão feitas via *soft_delete* (coluna `deleted_at`).

### Fase 3: Integração Financeira (Stripe)
* Desenvolver o Dashboard Financeiro utilizando Tremor.so focado em MRR, Churn Rate e Faturamento Previsto.
* Implementar a visualização de gestão de assinaturas (Cancelamentos, Upgrades/Downgrades).
* **Diretriz Obrigatória:** Os dados de faturamento devem vir da API do Stripe. Não salvar métricas financeiras processadas no banco. 
* O painel deve suportar a visualização da saúde financeira segmentada pelos planos da plataforma (Starter, Pro e Studio).
* Implementar Next.js Data Cache nas requisições da API do Stripe para evitar bloqueios por Rate Limit da plataforma.

### Fase 4: Observabilidade e Auditoria
* Criar a tabela `audit_logs` no Supabase.
* Implementar registro de auditoria focado nas Server Actions. Toda ação de mutação validará o token admin e gravará os logs na base (Quem fez, o que fez, quando). Não utilizar Edge Middleware para gravação direta no banco.
* Configurar o recebimento de Webhooks para refletir as transações.