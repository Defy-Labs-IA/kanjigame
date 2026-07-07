# Kanji Memory Game — Webapp (esqueleto)

Next.js 14 (App Router, TypeScript). Roda **100% local, sem banco de dados**, consumindo
o catálogo e os assets gerados pelo pipeline em `../scripts`.

## Rodar

```bash
cd web
npm install
npm run dev        # http://localhost:3000
```

## O que já existe

| Rota | Descrição |
|---|---|
| `/` | Home |
| `/jogar` | **Fase 1 jogável** — memória de pares com microaula completa no acerto (áudio + animação de traços + hiragana/romaji/tradução), pontuação, combo, reorganização das colunas e tela de resultado com estrelas |
| `/admin` | **Painel de revisão autenticado** — ouvir/validar leituras, síntese de voz (Web Speech), tocar MP3, aprovar/corrigir, exportar `decisoes.json` |
| `/admin/login` | Login (senha) |

## Autenticação do /admin

- `middleware.ts` protege `/admin/*` exigindo o cookie de sessão.
- `/api/admin/login` compara a senha com `ADMIN_PASSWORD` (em `.env.local`) e grava um
  cookie **httpOnly** — a senha nunca vai para o bundle do cliente.
- Senha padrão: `kanji-admin` (troque em `.env.local`).
- ⚠️ É uma auth simples (cookie não assinado) adequada para ferramenta interna. Para produção
  pública, migrar para **Supabase Auth** (papel `admin`) — ver abaixo.

## Dados e assets

- `data/catalogo.json` — 300 kanjis (importado direto em `lib/catalogo.ts`).
- `public/strokes/K###.svg` — 300 animações de traços (animCJK).
- `public/audio/K###.mp3` — 50 áudios (MVP). Para regenerar, use `../scripts/gerar_audio.py`.

Depois de revisar as leituras no `/admin`, exporte `decisoes.json`, rode
`python ../scripts/aplicar_revisao_json.py --decisoes decisoes.json`, reexporte o JSON com
`exportar_json_admin.py` e copie para `data/` + `public/data/`.

## Próximos passos (Path B — produção)

1. **Supabase**: migrar `catalogo.json` para tabelas Postgres; auth real com papel admin.
2. **Progresso do jogador**: entidades Partida/ProgressoKanji (PRD §13.1).
3. **Fases 2–30**: já mapeadas no catálogo; a UI de jogo é genérica (`getFase(n)`).
4. **Deploy**: Vercel (já compatível).

## Nota de segurança

Fixada a `next@14.2.35` para corrigir a CVE-2025-29927 (bypass de autorização no middleware).
Não baixar abaixo dessa versão enquanto a auth depender do middleware.
