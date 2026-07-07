import catalogo from "@/data/catalogo.json";

export type Kanji = {
  id: string;
  kanji: string;
  significado: string;
  mundo: string;
  fase: number | string;
  hiragana: string;
  romaji: string;
  on: string[];
  kun: string[];
  tracos: number | null;
  needsReview: boolean;
  status: string;
};

export const TODOS: Kanji[] = catalogo as Kanji[];

/** Retorna os kanjis de uma fase, ordenados por ID. */
export function getFase(fase: number): Kanji[] {
  return TODOS.filter((k) => Number(k.fase) === fase).sort((a, b) =>
    a.id.localeCompare(b.id)
  );
}

export function getKanji(id: string): Kanji | undefined {
  return TODOS.find((k) => k.id === id);
}
