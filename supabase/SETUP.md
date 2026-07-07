# Integração Supabase — passo a passo

O webapp funciona **sem** Supabase (usa `web/data/catalogo.json`). Com as chaves configuradas,
ele passa a ler o catálogo do Supabase e o painel `/admin` pode **salvar as revisões no banco**.

## 1. Criar o projeto
1. Acesse https://supabase.com → New project (o plano gratuito basta).
2. Escolha uma região (ex.: South America / São Paulo) e defina a senha do banco.

## 2. Criar as tabelas
No painel do Supabase: **SQL Editor → New query** → cole e rode, nesta ordem:
1. `supabase/schema.sql`  (cria a tabela `kanji` + RLS)
2. `supabase/seed.sql`    (insere os 300 kanjis; regenerável com `python scripts/gerar_seed_sql.py`)

## 3. Pegar as chaves
**Project Settings → API**. Copie para `web/.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`  = Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public
- `SUPABASE_SERVICE_ROLE_KEY` = service_role (⚠️ **segredo**, só no servidor — nunca no cliente)

Reinicie o `npm run dev`.

## 4. Verificar
- Home/Jogo continuam funcionando (agora lendo do banco).
- Em `/admin`, revise leituras e clique **☁ Salvar no banco** → grava em `public.kanji`
  (`status = 'Validado (revisor)'`, `needs_review = false`).
- Sem as chaves, o botão responde "Supabase não configurado" e o app segue no JSON.

## Como funciona (segurança)
- **Leitura**: RLS permite `select` público (catálogo é conteúdo aberto).
- **Escrita**: nenhuma policy para anon/authenticated → só o **service_role** grava, e ele é usado
  apenas no backend (`/api/admin/salvar`), protegido pelo cookie de admin.

## Próximos passos (Path B completo)
- **Supabase Auth** para o `/admin` (papel `admin`) no lugar do cookie simples.
- Tabelas de **progresso do jogador** (Partida, ProgressoKanji) do PRD §13.1.
- Deploy na **Vercel** (defina as mesmas variáveis de ambiente no projeto).
