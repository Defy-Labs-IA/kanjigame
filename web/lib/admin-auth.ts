import { serverClient } from "@/lib/supabase-server";
import type { User } from "@supabase/supabase-js";

/** Retorna o usuário logado (ou null) usando getUser() — checagem confiável no servidor. */
export async function usuarioAtual(): Promise<User | null> {
  const {
    data: { user },
  } = await serverClient().auth.getUser();
  return user;
}

/** Autorização: papel admin fica em app_metadata.role (não editável pelo usuário). */
export function ehAdmin(user: User | null): boolean {
  return user?.app_metadata?.role === "admin";
}
