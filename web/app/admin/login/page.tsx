"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { browserClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const supabase = browserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) {
      setErro("E-mail ou senha inválidos.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="wrap">
      <form className="login" onSubmit={entrar}>
        <div className="logo jp">漢字</div>
        <h2>Painel do administrador</h2>
        <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        <input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        <button className="btn" type="submit" style={{ width: "100%" }} disabled={carregando}>
          {carregando ? "Entrando…" : "Entrar"}
        </button>
        <div className="erro">{erro}</div>
        <div className="note" style={{ marginTop: 10 }}>
          Acesso restrito. Peça a um administrador para criar sua conta.
        </div>
      </form>
    </main>
  );
}
