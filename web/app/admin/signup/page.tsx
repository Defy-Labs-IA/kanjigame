"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { browserClient } from "@/lib/supabase-browser";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (senha.length < 6) {
      setErro("A senha deve ter ao menos 6 caracteres.");
      return;
    }
    setCarregando(true);
    // 1) cria a conta (já confirmada) via rota no servidor
    const res = await fetch("/api/admin/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });
    const j = await res.json();
    if (!j.ok) {
      setCarregando(false);
      setErro(j.erro || "Não foi possível criar a conta.");
      return;
    }
    // 2) entra automaticamente
    const supabase = browserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) {
      setErro("Conta criada. Faça login.");
      router.push("/admin/login");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="wrap">
      <form className="login" onSubmit={cadastrar}>
        <div className="logo jp">漢字</div>
        <h2>Criar conta</h2>
        <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        <input type="password" placeholder="Senha (mín. 6)" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        <button className="btn" type="submit" style={{ width: "100%" }} disabled={carregando}>
          {carregando ? "Criando…" : "Criar conta e entrar"}
        </button>
        <div className="erro">{erro}</div>
        <div className="note" style={{ marginTop: 10 }}>
          Já tem conta? <Link href="/admin/login" style={{ color: "var(--turq)" }}>Entrar</Link>
        </div>
      </form>
    </main>
  );
}
