import { TODOS as JSON_TODOS, type Kanji } from "@/lib/catalogo";
import { supabasePublic } from "@/lib/supabase";

// Camada de dados: usa o Supabase quando configurado; senão cai no catalogo.json local.

function mapRow(r: any): Kanji {
  return {
    id: r.id,
    kanji: r.kanji,
    significado: r.significado,
    mundo: r.mundo,
    fase: r.fase,
    hiragana: r.hiragana || "",
    romaji: r.romaji || "",
    on: r.onyomi || [],
    kun: r.kunyomi || [],
    tracos: r.tracos,
    needsReview: r.needs_review,
    status: r.status || "",
  };
}

export async function getTodos(): Promise<Kanji[]> {
  const sb = supabasePublic();
  if (!sb) return JSON_TODOS;
  const { data, error } = await sb.from("kanji").select("*").order("id");
  if (error || !data || !data.length) return JSON_TODOS; // fallback resiliente
  return data.map(mapRow);
}

export async function getFase(fase: number): Promise<Kanji[]> {
  const all = await getTodos();
  return all
    .filter((k) => Number(k.fase) === fase)
    .sort((a, b) => a.id.localeCompare(b.id));
}
