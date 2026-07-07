import Link from "next/link";
import { getTodos } from "@/lib/catalogoDB";
import type { Kanji } from "@/lib/catalogo";

export const dynamic = "force-dynamic";

type FaseInfo = { fase: number; mundo: string; kanjis: string[] };

function agrupar(todos: Kanji[]): { mundo: string; fases: FaseInfo[] }[] {
  const porFase = new Map<number, FaseInfo>();
  for (const k of todos) {
    const n = Number(k.fase);
    if (!Number.isInteger(n)) continue;
    if (!porFase.has(n)) porFase.set(n, { fase: n, mundo: k.mundo || "", kanjis: [] });
    porFase.get(n)!.kanjis.push(k.kanji);
  }
  const fases = [...porFase.values()].sort((a, b) => a.fase - b.fase);
  // agrupa por mundo, preservando a ordem
  const mundos: { mundo: string; fases: FaseInfo[] }[] = [];
  for (const f of fases) {
    let m = mundos.find((x) => x.mundo === f.mundo);
    if (!m) {
      m = { mundo: f.mundo, fases: [] };
      mundos.push(m);
    }
    m.fases.push(f);
  }
  return mundos;
}

export default async function MapaPage() {
  const mundos = agrupar(await getTodos());
  return (
    <main className="wrap">
      <div style={{ marginBottom: 12 }}>
        <Link className="btn ghost" href="/">← Início</Link>
      </div>
      <h1 style={{ textAlign: "center" }}>Mapa de fases</h1>
      {mundos.map((m, i) => (
        <section key={i} style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, color: "var(--turq)" }}>{m.mundo}</h2>
          <div className="mapa-grid">
            {m.fases.map((f) => (
              <Link key={f.fase} href={`/jogar/${f.fase}`} className="fase-card">
                <div className="fase-num">Fase {f.fase}</div>
                <div className="fase-kanjis jp">{f.kanjis.slice(0, 10).join(" ")}</div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
