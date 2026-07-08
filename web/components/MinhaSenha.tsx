"use client";

import { useState } from "react";
import { browserClient } from "@/lib/supabase-browser";

export default function MinhaSenha() {
  const [senha, setSenha] = useState("");
  const [msg, setMsg] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    if (senha.length < 6) {
      setMsg("A senha deve ter ao menos 6 caracteres.");
      return;
    }
    setCarregando(true);
    const { error } = await browserClient().auth.updateUser({ password: senha });
    setCarregando(false);
    if (error) setMsg("Erro: " + error.message);
    else {
      setSenha("");
      setMsg("✓ Senha alterada.");
    }
  }

  return (
    <form onSubmit={salvar} className="cfg-form">
      <input
        type="password"
        placeholder="Nova senha (mín. 6)"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
      />
      <button className="btn" type="submit" disabled={carregando}>
        {carregando ? "Salvando…" : "Alterar minha senha"}
      </button>
      {msg && <span className="cfg-msg">{msg}</span>}
    </form>
  );
}
