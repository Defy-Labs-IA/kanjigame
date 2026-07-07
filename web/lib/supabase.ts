import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** true se as chaves públicas de leitura estão presentes. */
export function supabaseConfigurado(): boolean {
  return Boolean(url && anon);
}

/** Cliente de LEITURA (anon). Retorna null se não configurado -> app usa o JSON local. */
export function supabasePublic(): SupabaseClient | null {
  if (!url || !anon) return null;
  return createClient(url, anon, { auth: { persistSession: false } });
}

/** Cliente de ESCRITA (service_role) — SOMENTE no servidor. Ignora RLS. */
export function supabaseAdmin(): SupabaseClient | null {
  if (!url || !service) return null;
  return createClient(url, service, { auth: { persistSession: false } });
}
