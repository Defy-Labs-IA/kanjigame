# Roadmap — Validação do traçado (modo Superavançado)

Este documento descreve a evolução da validação do traçado do modo **Superavançado**,
priorizando soluções **gratuitas e on-device** (sem servidor, sem custo por uso).

## ✅ Pré-requisito — capturar os traços como dados (IMPLEMENTADO)

O `PadDesenho` grava cada traço como sequência ordenada de pontos `{x, y}` (um array por traço),
nos handlers de Pointer Events. Isso destrava a comparação.

## ✅ Fase 2 — Heurística geométrica (IMPLEMENTADA, grátis, sem ML)

Em `lib/tracado.ts` + botão **✓ Avaliar** no `PadDesenho`. Compara os traços do usuário com os
traços de referência extraídos do **KanjiVG/animCJK** (via `getPointAtLength` sobre os
`path[clip-path]`, na ordem correta):

- **Contagem de traços** — reportada (ex.: 2/2) e ponderada na nota.
- **Forma + ordem** — cada traço é reamostrado em 32 pontos; compara-se a distância média
  (após normalização pela bounding box global). Traço na ordem/direção errada pontua baixo.
- **Nota 0–100** = 35% contagem + 65% forma → **Precisa treinar / Bom / Muito bom**.
- Verificado: traçar sobre a referência → ~90–99 ("Muito bom"); rabisco → ~18 ("Precisa treinar").

Custo: R$ 0, roda no navegador. Limiar (`TH`) e pesos são ajustáveis em `lib/tracado.ts`.
Melhorias possíveis ainda sem ML: **DTW** no lugar da distância ponto-a-ponto, tolerância a
traços fora de ordem, e feedback por traço (qual saiu ruim).

## Fase 3 — Reconhecimento on-device (grátis)

Reconhecer o caractere desenhado e conferir se corresponde ao esperado, com confiança:

- **KanjiCanvas** — reconhecimento de kanji 100% client-side em JavaScript, independente de
  ordem/número de traços. Ideal para web, sem servidor. https://github.com/asdfjkl/kanjicanvas
- **Zinnia / Tegaki** — motor de reconhecimento online (SVM) que recebe os traços e devolve os
  n melhores candidatos com confiança. https://tegaki.github.io/
- **kanjidraw** — casa o traçado contra uma base derivada do **KanjiVG** (o mesmo que já usamos).
  https://github.com/obfusk/kanjidraw
- **TensorFlow.js** — modelo próprio (CNN) rodando no dispositivo, treinado em dataset de
  caligrafia (ex.: ETL). Mais trabalho, mas total controle.

Estratégia: usar o reconhecedor para "é mesmo este kanji?" + a heurística da Fase 2 para a nota.

## Fase 4 — IA de precisão (opcional, pode ter custo)

Só se quiser feedback traço-a-traço de nível profissional:

- **MyScript** ou **Google ML Kit / Handwriting** — reconhecimento comercial de alta qualidade
  (custo por uso / licença).
- **Modelo fino próprio** para os 300 kanjis, com feedback por traço (ordem, direção, proporção,
  posição) e mapa de calor de erros.

## Recomendação de sequência

1. **Fase 2** primeiro (grátis, alto valor pedagógico, reaproveita o KanjiVG).
2. **Fase 3** com **KanjiCanvas** (mais fácil de integrar na web) para elevar a acurácia.
3. **Fase 4** só se houver demanda por precisão profissional.

## Fontes

- KanjiCanvas — https://github.com/asdfjkl/kanjicanvas
- Tegaki / Zinnia — https://tegaki.github.io/
- kanjidraw (base KanjiVG) — https://github.com/obfusk/kanjidraw
