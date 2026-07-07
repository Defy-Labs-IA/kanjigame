# Pipeline de conteúdo — Kanji Memory Game

Scripts que preenchem as lacunas do catálogo a partir de **fontes gratuitas verificadas**.
Todos usam apenas a biblioteca padrão do Python + `openpyxl` (e `edge-tts` só para o áudio de teste).

## Instalação

```bash
pip install -r requirements.txt
```

## Ordem de execução

```bash
# 1) Preencher leituras (on/kun/traços) + propor leitura principal via kanjiapi.dev
python preencher_catalogo.py                 # todos os 300  (ou --limit 50 para o MVP)

# 2) Baixar as animações de traços (SVG) do animCJK
python baixar_tracos.py                       # ou --limit 50

# 3) Gerar os áudios de pronúncia (a partir da coluna hiragana, NUNCA do kanji)
python gerar_audio.py --engine edge           # protótipo (grátis, sem chave)
python gerar_audio.py --engine gcloud         # produção (free tier, direito comercial claro)
python gerar_audio.py --engine azure          # alternativa de produção
```

Saídas:
- Planilha preenchida: `Kanji_Memory_Game_Catalogo_300_v1_v2_auto.xlsx` (o original **não** é alterado)
- Traços: `assets/strokes/K###.svg`
- Áudio:  `assets/audio/K###.mp3`

Todos os scripts são **idempotentes**: pulam o que já existe e cacheiam as respostas da API
(`scripts/cache/`), então podem ser reexecutados sem custo.

## ⚠️ Revisão humana obrigatória (não é opcional)

`preencher_catalogo.py` preenche como **fato** on'yomi, kun'yomi e nº de traços (dados do
KANJIDIC2). Mas a **"leitura principal da fase"** é uma decisão pedagógica: o script gera uma
*proposta* (marcada como `Revisar leitura (auto)` na coluna Status) e lista as leituras
candidatas em Observações. A heurística acerta a maioria, mas erra casos como 円 (propõe まど,
sendo que para "iene" o correto é えん). **Antes de publicar, alguém que saiba japonês precisa
revisar as linhas marcadas.** Só depois disso gere o áudio definitivo.

## Como obter as chaves de TTS de produção (free tier)

- **Google Cloud TTS**: crie um projeto em console.cloud.google.com → ative "Cloud Text-to-Speech
  API" → gere uma API key → `set GOOGLE_TTS_API_KEY=...` (Windows) antes de rodar. Free tier cobre
  folgado 300 palavras/mês.
- **Azure Speech**: crie um recurso "Speech" no portal Azure → copie chave e região →
  `set AZURE_TTS_KEY=...` e `set AZURE_TTS_REGION=brazilsouth`.

## Licenças (ver ../CREDITS.md)

Os dados e SVGs vêm de fontes **CC BY-SA** e **Arphic Public License**, que exigem **atribuição**
no app. O texto pronto para colar está em `../CREDITS.md`.
