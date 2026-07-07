# -*- coding: utf-8 -*-
"""
gerar_seed_sql.py
-----------------
Gera supabase/seed.sql (UPSERT dos 300 kanjis) a partir do catalogo.json usado pelo webapp.
Rode o seed.sql no SQL Editor do Supabase depois do schema.sql.

Uso:
  python gerar_seed_sql.py
"""
import argparse
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SRC_DEFAULT = RAIZ / "web" / "data" / "catalogo.json"
OUT_DEFAULT = RAIZ / "supabase" / "seed.sql"


def esc(s):
    return str(s).replace("'", "''")


def arr(lst):
    if not lst:
        return "'{}'"
    inner = ",".join('"' + esc(x).replace('"', '\\"') + '"' for x in lst)
    return "'{" + inner + "}'"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=str(SRC_DEFAULT))
    ap.add_argument("--out", default=str(OUT_DEFAULT))
    args = ap.parse_args()

    dados = json.loads(Path(args.src).read_text(encoding="utf-8"))
    linhas = [
        "-- Seed gerado por scripts/gerar_seed_sql.py",
        "insert into public.kanji",
        "  (id, kanji, significado, mundo, fase, hiragana, romaji, onyomi, kunyomi, tracos, needs_review, status)",
        "values",
    ]
    vals = []
    for k in dados:
        fase = k.get("fase")
        fase_sql = str(int(fase)) if str(fase).strip().isdigit() else "null"
        tracos = k.get("tracos")
        tracos_sql = str(int(tracos)) if isinstance(tracos, (int, float)) or (tracos and str(tracos).isdigit()) else "null"
        vals.append(
            f"  ('{esc(k['id'])}', '{esc(k['kanji'])}', '{esc(k['significado'])}', "
            f"'{esc(k.get('mundo',''))}', {fase_sql}, '{esc(k.get('hiragana',''))}', "
            f"'{esc(k.get('romaji',''))}', {arr(k.get('on'))}, {arr(k.get('kun'))}, "
            f"{tracos_sql}, {str(bool(k.get('needsReview'))).lower()}, '{esc(k.get('status','Novo'))}')"
        )
    linhas.append(",\n".join(vals))
    linhas.append(
        "on conflict (id) do update set\n"
        "  kanji=excluded.kanji, significado=excluded.significado, mundo=excluded.mundo,\n"
        "  fase=excluded.fase, hiragana=excluded.hiragana, romaji=excluded.romaji,\n"
        "  onyomi=excluded.onyomi, kunyomi=excluded.kunyomi, tracos=excluded.tracos,\n"
        "  needs_review=excluded.needs_review, status=excluded.status;"
    )
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(linhas) + "\n", encoding="utf-8")
    print(f"Seed gerado: {out}  ({len(dados)} kanjis)")


if __name__ == "__main__":
    main()
