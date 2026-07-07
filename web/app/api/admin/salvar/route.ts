import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { serverClient } from "@/lib/supabase-server";

// Persiste as leituras revisadas no Supabase (escrita via service_role, no servidor).
// Exige sessão Supabase (usuário logado no /admin).
export async function POST(req: Request) {
  const {
    data: { user },
  } = await serverClient().auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, erro: "não autenticado" }, { status: 401 });
  }

  const sb = supabaseAdmin();
  if (!sb) {
    return NextResponse.json(
      { ok: false, erro: "Supabase não configurado (defina SUPABASE_SERVICE_ROLE_KEY em .env.local)" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  const decisoes = Array.isArray(body?.decisoes) ? body.decisoes : [];
  if (!decisoes.length) {
    return NextResponse.json({ ok: false, erro: "nada para salvar" }, { status: 400 });
  }

  const resultados = await Promise.all(
    decisoes.map((d: any) =>
      sb
        .from("kanji")
        .update({
          hiragana: d.hiragana,
          romaji: d.romaji,
          status: "Validado (revisor)",
          needs_review: false,
        })
        .eq("id", d.id)
    )
  );

  const erro = resultados.find((r) => r.error)?.error;
  if (erro) {
    return NextResponse.json({ ok: false, erro: erro.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, salvos: decisoes.length });
}
