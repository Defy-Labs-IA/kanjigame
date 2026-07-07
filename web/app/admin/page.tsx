import Link from "next/link";
import PainelRevisao from "@/components/PainelRevisao";
import BotaoSair from "@/components/BotaoSair";
import { getTodos } from "@/lib/catalogoDB";

// lê o catálogo do banco a cada request
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const kanjis = await getTodos();
  return (
    <main className="wrap">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>
          <span className="jp" style={{ color: "var(--coral)" }}>漢字</span> Revisão de leituras &amp; áudio
        </h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Link className="btn ghost" href="/">Início</Link>
          <BotaoSair />
        </div>
      </div>
      <PainelRevisao kanjis={kanjis} />
    </main>
  );
}
