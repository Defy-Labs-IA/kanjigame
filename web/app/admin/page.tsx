import Link from "next/link";
import PainelRevisao from "@/components/PainelRevisao";

export default function AdminPage() {
  return (
    <main className="wrap">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>
          <span className="jp" style={{ color: "var(--coral)" }}>漢字</span> Revisão de leituras &amp; áudio
        </h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Link className="btn ghost" href="/">Início</Link>
          <form action="/api/admin/logout" method="post">
            <button className="btn ghost" type="submit">Sair</button>
          </form>
        </div>
      </div>
      <PainelRevisao />
    </main>
  );
}
