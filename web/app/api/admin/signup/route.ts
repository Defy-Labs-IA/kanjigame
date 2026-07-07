import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Cadastro aberto SEM verificação de e-mail: cria a conta já confirmada via service_role.
export async function POST(req: Request) {
  const sb = supabaseAdmin();
  if (!sb) {
    return NextResponse.json(
      { ok: false, erro: "Supabase não configurado no servidor." },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  const email = String(body?.email || "").trim();
  const senha = String(body?.senha || "");
  if (!email || senha.length < 6) {
    return NextResponse.json({ ok: false, erro: "E-mail e senha (mín. 6) obrigatórios." }, { status: 400 });
  }

  const { error } = await sb.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true, // já confirmado -> login imediato, sem e-mail de verificação
  });

  if (error) {
    const msg = /already/i.test(error.message) ? "E-mail já cadastrado." : error.message;
    return NextResponse.json({ ok: false, erro: msg }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
