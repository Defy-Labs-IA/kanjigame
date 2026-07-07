"use client";

import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase-browser";

export default function BotaoSair() {
  const router = useRouter();
  async function sair() {
    await browserClient().auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }
  return (
    <button className="btn ghost" type="button" onClick={sair}>
      Sair
    </button>
  );
}
