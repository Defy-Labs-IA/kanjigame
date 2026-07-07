import Link from "next/link";
import { getFase } from "@/lib/catalogoDB";
import ModoSwitch from "@/components/ModoSwitch";

// conteúdo vem do banco -> renderizar por request (sem cache estático)
export const dynamic = "force-dynamic";

export default async function Home() {
  const fase1 = await getFase(1);
  return (
    <main className="wrap">
      <div className="topbar" style={{ paddingTop: 12 }}>
        <ModoSwitch />
      </div>
      <section className="hero">
        <div className="logo jp">漢字</div>
        <h1>Kanji Memory Game</h1>
        <p>Aprender, ouvir, observar, escrever e lembrar.</p>
        <div className="actions">
          <Link className="btn" href="/mapa">
            Jogar
          </Link>
          <Link className="btn ghost" href="/admin">
            Painel do administrador
          </Link>
        </div>
        <p style={{ marginTop: 24, fontSize: 13 }}>
          Fase 1: {fase1.length} kanjis ({fase1.map((k) => k.kanji).join(" ")})
        </p>
      </section>
    </main>
  );
}
