import Link from "next/link";
import { getFase } from "@/lib/catalogoDB";
import Jogo from "@/components/Jogo";

export default async function JogarPage() {
  const kanjis = await getFase(1);
  return (
    <main className="wrap">
      <div style={{ marginBottom: 12 }}>
        <Link className="btn ghost" href="/">
          ← Voltar
        </Link>
      </div>
      <Jogo kanjis={kanjis} faseNome="Fase 1 — Números" />
    </main>
  );
}
