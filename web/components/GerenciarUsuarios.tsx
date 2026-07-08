"use client";

import { useEffect, useState } from "react";

type Usuario = { id: string; email: string; admin: boolean; criado: string };

export default function GerenciarUsuarios({ meuId }: { meuId: string }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [msg, setMsg] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [novoAdmin, setNovoAdmin] = useState(true);

  async function carregar() {
    const r = await fetch("/api/admin/usuarios");
    const j = await r.json();
    if (j.ok) setUsuarios(j.usuarios);
    else setMsg(j.erro || "Erro ao carregar.");
  }
  useEffect(() => {
    carregar();
  }, []);

  async function acao(body: any, okMsg: string) {
    setMsg("");
    const r = await fetch("/api/admin/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (j.ok) {
      setMsg("✓ " + okMsg);
      carregar();
    } else {
      setMsg("Erro: " + j.erro);
    }
    return j.ok;
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    const ok = await acao(
      { acao: "criar", email: novoEmail.trim(), senha: novaSenha, admin: novoAdmin },
      "Usuário criado."
    );
    if (ok) {
      setNovoEmail("");
      setNovaSenha("");
    }
  }

  function definirSenha(u: Usuario) {
    const s = window.prompt(`Nova senha para ${u.email} (mín. 6):`);
    if (s == null) return;
    acao({ acao: "senha", id: u.id, senha: s }, "Senha atualizada.");
  }

  function alternarAdmin(u: Usuario) {
    acao({ acao: "papel", id: u.id, admin: !u.admin }, u.admin ? "Admin revogado." : "Admin concedido.");
  }

  return (
    <div>
      <form onSubmit={criar} className="cfg-form" style={{ marginBottom: 14 }}>
        <input type="email" placeholder="E-mail do novo usuário" value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} required />
        <input type="text" placeholder="Senha (mín. 6)" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} required />
        <label className="cfg-check">
          <input type="checkbox" checked={novoAdmin} onChange={(e) => setNovoAdmin(e.target.checked)} /> admin
        </label>
        <button className="btn" type="submit">+ Criar usuário</button>
      </form>

      {msg && <div className="cfg-msg" style={{ marginBottom: 10 }}>{msg}</div>}

      <table className="cfg-tabela">
        <thead>
          <tr><th>E-mail</th><th>Admin</th><th>Ações</th></tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id}>
              <td>{u.email}{u.id === meuId && <span className="rsub"> (você)</span>}</td>
              <td>{u.admin ? "sim" : "não"}</td>
              <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button className="btn ghost cfg-mini" onClick={() => definirSenha(u)}>Definir senha</button>
                <button className="btn ghost cfg-mini" onClick={() => alternarAdmin(u)} disabled={u.id === meuId}>
                  {u.admin ? "Revogar admin" : "Tornar admin"}
                </button>
              </td>
            </tr>
          ))}
          {!usuarios.length && <tr><td colSpan={3} className="rsub">Nenhum usuário carregado.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
