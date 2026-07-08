import Link from "next/link";
import PainelRevisao from "@/components/PainelRevisao";
import BotaoSair from "@/components/BotaoSair";
import { getTodos } from "@/lib/catalogoDB";
import { usuarioAtual, ehAdmin } from "@/lib/admin-auth";

// lê o catálogo do banco a cada request
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await usuarioAtual();
  if (!ehAdmin(user)) {
    return (
      <main className="wrap">
        <div className="login" style={{ marginTop: 60 }}>
          <div className="logo jp">漢字</div>
          <h2>Acesso não autorizado</h2>
          <p className="rsub">
            Sua conta ({user?.email}) não tem permissão de administrador. Peça a um
            administrador para liberar seu acesso.
          </p>
          <div style={{ marginTop: 12 }}>
            <BotaoSair />
          </div>
        </div>
      </main>
    );
  }

  const kanjis = await getTodos();
  return (
    <main className="wrap">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>
          <span className="jp" style={{ color: "var(--coral)" }}>漢字</span> Revisão de leituras &amp; áudio
        </h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Link className="btn ghost" href="/admin/config">⚙ Configurações</Link>
          <Link className="btn ghost" href="/">Início</Link>
          <BotaoSair />
        </div>
      </div>
      <PainelRevisao kanjis={kanjis} />
    </main>
  );
}
