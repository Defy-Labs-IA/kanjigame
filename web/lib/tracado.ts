// Comparação heurística de traçado (Fase 2) — sem IA, roda no navegador.
// Compara os traços do usuário com os traços de referência do KanjiVG/animCJK
// por contagem, ordem e forma (reamostragem + distância média normalizada).

export type Pt = { x: number; y: number };
export type Stroke = Pt[];

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

/** Reamostra um traço em n pontos equidistantes ao longo do comprimento. */
export function resample(points: Stroke, n = 32): Stroke {
  if (points.length === 0) return [];
  if (points.length === 1) return Array.from({ length: n }, () => points[0]);
  let total = 0;
  for (let i = 1; i < points.length; i++) total += dist(points[i - 1], points[i]);
  const interval = total / (n - 1) || 1;
  const out: Stroke = [points[0]];
  let acc = 0;
  let prev = points[0];
  for (let i = 1; i < points.length; ) {
    const d = dist(prev, points[i]);
    if (acc + d >= interval) {
      const t = (interval - acc) / d;
      const np = { x: prev.x + t * (points[i].x - prev.x), y: prev.y + t * (points[i].y - prev.y) };
      out.push(np);
      prev = np;
      acc = 0;
    } else {
      acc += d;
      prev = points[i];
      i++;
    }
  }
  while (out.length < n) out.push(points[points.length - 1]);
  return out.slice(0, n);
}

/** Normaliza um conjunto de traços pela bounding box global (mesma escala p/ ambos). */
export function normalize(strokes: Stroke[]): Stroke[] {
  const all = strokes.flat();
  if (!all.length) return strokes;
  const xs = all.map((p) => p.x);
  const ys = all.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const scale = 1 / (Math.max(maxX - minX, maxY - minY) || 1);
  return strokes.map((s) => s.map((p) => ({ x: (p.x - minX) * scale, y: (p.y - minY) * scale })));
}

export type Resultado = {
  score: number; // 0..100
  nota: "Muito bom" | "Bom" | "Precisa treinar";
  uCount: number;
  rCount: number;
};

/** Nota simples 0..100 combinando contagem de traços e semelhança de forma/ordem. */
export function pontuar(user: Stroke[], ref: Stroke[]): Resultado {
  const N = 32;
  const TH = 0.3; // distância média (em coords normalizadas) que zera a nota — ajustável
  const rCount = ref.length;
  const uCount = user.length;

  const nUser = normalize(user).map((s) => resample(s, N));
  const nRef = normalize(ref).map((s) => resample(s, N));

  let simSum = 0;
  const m = Math.min(rCount, uCount);
  for (let i = 0; i < m; i++) {
    let d = 0;
    for (let j = 0; j < N; j++) d += dist(nUser[i][j], nRef[i][j]);
    d /= N;
    simSum += Math.max(0, 1 - d / TH);
  }
  // traços faltando ou sobrando penalizam (dividimos pelo total de referência)
  const shapeScore = rCount ? simSum / rCount : 0;
  const countScore = rCount ? Math.max(0, 1 - Math.abs(uCount - rCount) / rCount) : 0;
  const score = Math.round((0.35 * countScore + 0.65 * shapeScore) * 100);

  const nota = score >= 80 ? "Muito bom" : score >= 55 ? "Bom" : "Precisa treinar";
  return { score, nota, uCount, rCount };
}

/** Extrai os traços de referência (em coords do viewBox) de um SVG animCJK/KanjiVG. */
export function extrairRefStrokes(svg: SVGSVGElement, n = 32): Stroke[] {
  const paths = svg.querySelectorAll("path[clip-path]");
  const strokes: Stroke[] = [];
  paths.forEach((el) => {
    const path = el as unknown as SVGPathElement;
    const len = path.getTotalLength?.() || 0;
    if (!len) return;
    const pts: Stroke = [];
    for (let i = 0; i < n; i++) {
      const p = path.getPointAtLength((len * i) / (n - 1));
      pts.push({ x: p.x, y: p.y });
    }
    strokes.push(pts);
  });
  return strokes;
}
