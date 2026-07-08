import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { usuarioAtual, ehAdmin } from "@/lib/admin-auth";

// Gerência de usuários — SOMENTE admin. Usa service_role no servidor.

async function guard() {
  const user = await usuarioAtual();
  if (!ehAdmin(user)) return null;
  const sb = supabaseAdmin();
  return sb ? { user, sb } : null;
}

export async function GET() {
  const ctx = await guard();
  if (!ctx) return NextResponse.json({ ok: false, erro: "não autorizado" }, { status: 403 });

  const { data, error } = await ctx.sb.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) return NextResponse.json({ ok: false, erro: error.message }, { status: 500 });

  const usuarios = data.users.map((u) => ({
    id: u.id,
    email: u.email,
    admin: u.app_metadata?.role === "admin",
    criado: u.created_at,
  }));
  return NextResponse.json({ ok: true, usuarios });
}

export async function POST(req: Request) {
  const ctx = await guard();
  if (!ctx) return NextResponse.json({ ok: false, erro: "não autorizado" }, { status: 403 });
  const { sb, user } = ctx;

  const body = await req.json().catch(() => null);
  const acao = body?.acao as string;

  try {
    if (acao === "criar") {
      const email = String(body.email || "").trim();
      const senha = String(body.senha || "");
      if (!email || senha.length < 6)
        return NextResponse.json({ ok: false, erro: "E-mail e senha (mín. 6) obrigatórios." }, { status: 400 });
      const { error } = await sb.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
        app_metadata: { role: body.admin ? "admin" : "user" },
      });
      if (error) return NextResponse.json({ ok: false, erro: /already/i.test(error.message) ? "E-mail já cadastrado." : error.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    if (acao === "senha") {
      const id = String(body.id || "");
      const senha = String(body.senha || "");
      if (!id || senha.length < 6)
        return NextResponse.json({ ok: false, erro: "Senha mín. 6 caracteres." }, { status: 400 });
      const { error } = await sb.auth.admin.updateUserById(id, { password: senha });
      if (error) return NextResponse.json({ ok: false, erro: error.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    if (acao === "papel") {
      const id = String(body.id || "");
      const admin = Boolean(body.admin);
      if (id === user!.id && !admin)
        return NextResponse.json({ ok: false, erro: "Você não pode remover o próprio admin." }, { status: 400 });
      const { error } = await sb.auth.admin.updateUserById(id, { app_metadata: { role: admin ? "admin" : "user" } });
      if (error) return NextResponse.json({ ok: false, erro: error.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, erro: "ação inválida" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erro: e?.message || "erro" }, { status: 500 });
  }
}
