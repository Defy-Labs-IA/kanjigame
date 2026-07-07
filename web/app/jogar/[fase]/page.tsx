import Link from "next/link";
import { notFound } from "next/navigation";
import { getFase } from "@/lib/catalogoDB";
import Jogo from "@/components/Jogo";

export const dynamic = "force-dynamic";

export default async function JogarFasePage({
  params,
}: {
  params: { fase: string };
}) {
  const n = Number(params.fase);
  if (!Number.isInteger(n) || n < 1) notFound();

  const kanjis = await getFase(n);
  if (!kanjis.length) notFound();

  const mundo = kanjis[0].mundo || "";
  return (
    <main className="wrap">
      <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
        <Link className="btn ghost" href="/mapa">← Mapa</Link>
      </div>
      <Jogo kanjis={kanjis} faseNome={`Fase ${n} — ${mundo}`} />
    </main>
  );
}
