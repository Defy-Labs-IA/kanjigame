# -*- coding: utf-8 -*-
"""
seed_supabase.py — insere/atualiza os 300 kanjis no Supabase via PostgREST (service_role).
Lê as chaves de web/.env.local. Idempotente (upsert por id).
"""
import json
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ENV = RAIZ / "web" / ".env.local"
CAT = RAIZ / "web" / "data" / "catalogo.json"


def ler_env():
    env = {}
    for linha in ENV.read_text(encoding="utf-8").splitlines():
        linha = linha.strip()
        if linha and not linha.startswith("#") and "=" in linha:
            k, v = linha.split("=", 1)
            env[k.strip()] = v.strip()
    return env


def main():
    env = ler_env()
    url = env["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
    key = env["SUPABASE_SERVICE_ROLE_KEY"]

    dados = json.loads(CAT.read_text(encoding="utf-8"))
    rows = []
    for k in dados:
        fase = k.get("fase")
        tracos = k.get("tracos")
        rows.append({
            "id": k["id"],
            "kanji": k["kanji"],
            "significado": k["significado"],
            "mundo": k.get("mundo") or None,
            "fase": int(fase) if str(fase).strip().isdigit() else None,
            "hiragana": k.get("hiragana") or None,
            "romaji": k.get("romaji") or None,
            "onyomi": k.get("on") or [],
            "kunyomi": k.get("kun") or [],
            "tracos": int(tracos) if isinstance(tracos, (int, float)) else None,
            "needs_review": bool(k.get("needsReview")),
            "status": k.get("status") or "Novo",
        })

    body = json.dumps(rows).encode("utf-8")
    req = urllib.request.Request(
        f"{url}/rest/v1/kanji?on_conflict=id",
        data=body,
        method="POST",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        print("Upsert HTTP", r.status, "| enviados:", len(rows))


if __name__ == "__main__":
    main()
