import { createBrowserClient } from "@supabase/ssr";

/** Cliente Supabase para componentes client (browser). Gerencia a sessão via cookies. */
export function browserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
