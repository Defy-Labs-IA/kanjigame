import Link from "next/link";
import { redirect } from "next/navigation";
import { usuarioAtual, ehAdmin } from "@/lib/admin-auth";
import BotaoSair from "@/components/BotaoSair";
import MinhaSenha from "@/components/MinhaSenha";
import GerenciarUsuarios from "@/components/GerenciarUsuarios";

export const dynamic = "force-dynamic";

export default async function ConfigPage() {
  const user = await usuarioAtual();
  if (!user) redirect("/login");
  if (!ehAdmin(user)) redirect("/admin");

  return (
    <main className="wrap">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>⚙ Configurações</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Link className="btn ghost" href="/admin">← Painel</Link>
          <BotaoSair />
        </div>
      </div>

      <section className="cfg-sec">
        <h2>Minha senha</h2>
        <p className="rsub">Conta: {user.email}</p>
        <MinhaSenha />
      </section>

      <section className="cfg-sec">
        <h2>Usuários</h2>
        <p className="rsub">Criar contas, definir senhas e conceder/revogar acesso de administrador.</p>
        <GerenciarUsuarios meuId={user.id} />
      </section>
    </main>
  );
}
