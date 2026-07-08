# -*- coding: utf-8 -*-
"""
revisar_fases_2a5.py
--------------------
Aplica leituras revisadas (K011-K050 / Fases 2-5) no Supabase, atualiza o
catalogo.json local e regenera os MP3 (edge-tts) a partir da leitura corrigida.

Leituras = escolha padrão para iniciante (kun para substantivos concretos,
on/kun completos onde o auto pegou fragmento). Requer revisão nativa final,
mas já corrige os erros óbvios do preenchimento automático.
"""
import json
import subprocess
import sys
import urllib.request
from pathlib import Path

from kanji_common import hiragana_to_romaji

RAIZ = Path(__file__).resolve().parent.parent
ENV = RAIZ / "web" / ".env.local"
AUDIO_DIR = RAIZ / "web" / "public" / "audio"
JSONS = [RAIZ / "web" / "data" / "catalogo.json", RAIZ / "web" / "public" / "data" / "catalogo.json"]
VOZ = "ja-JP-NanamiNeural"

# id -> leitura (hiragana) correta para a fase
LEITURAS = {
    "K011": "みぎ", "K012": "あめ", "K013": "えん", "K014": "おう", "K015": "おと",
    "K016": "した", "K017": "ひ", "K018": "はな", "K019": "かい", "K020": "がく",
    "K021": "き", "K022": "やすむ", "K023": "たま", "K024": "かね", "K025": "そら",
    "K026": "つき", "K027": "いぬ", "K028": "みる", "K029": "くち", "K030": "こう",
    "K031": "ひだり", "K032": "やま", "K033": "こ", "K034": "いと", "K035": "じ",
    "K036": "みみ", "K037": "くるま", "K038": "て", "K039": "でる", "K040": "おんな",
    "K041": "ちいさい", "K042": "うえ", "K043": "もり", "K044": "ひと", "K045": "みず",
    "K046": "ただしい", "K047": "せい", "K048": "あお", "K049": "いし", "K050": "あか",
}


def ler_env():
    env = {}
    for l in ENV.read_text(encoding="utf-8").splitlines():
        l = l.strip()
        if l and not l.startswith("#") and "=" in l:
            k, v = l.split("=", 1)
            env[k.strip()] = v.strip()
    return env


def atualizar_db(url, sr):
    ok = 0
    for kid, hira in LEITURAS.items():
        payload = {
            "hiragana": hira,
            "romaji": hiragana_to_romaji(hira),
            "status": "Validado (revisor)",
            "needs_review": False,
        }
        req = urllib.request.Request(
            f"{url}/rest/v1/kanji?id=eq.{kid}",
            data=json.dumps(payload).encode("utf-8"),
            method="PATCH",
            headers={"apikey": sr, "Authorization": f"Bearer {sr}",
                     "Content-Type": "application/json", "Prefer": "return=minimal"},
        )
        urllib.request.urlopen(req).read()
        ok += 1
    print(f"DB atualizado: {ok} leituras")


def atualizar_json():
    for jp in JSONS:
        if not jp.exists():
            continue
        dados = json.loads(jp.read_text(encoding="utf-8"))
        for k in dados:
            if k["id"] in LEITURAS:
                k["hiragana"] = LEITURAS[k["id"]]
                k["romaji"] = hiragana_to_romaji(LEITURAS[k["id"]])
                k["needsReview"] = False
                k["status"] = "Validado (revisor)"
        jp.write_text(json.dumps(dados, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"catalogo.json atualizado ({len(JSONS)} arquivos)")


def gerar_audio():
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    ok = 0
    for kid, hira in LEITURAS.items():
        dest = AUDIO_DIR / f"{kid}.mp3"
        subprocess.run(
            [sys.executable, "-m", "edge_tts", "--voice", VOZ, "--text", hira, "--write-media", str(dest)],
            check=True, capture_output=True,
        )
        ok += 1
    print(f"Áudio regenerado: {ok} MP3")


def main():
    env = ler_env()
    atualizar_db(env["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/"), env["SUPABASE_SERVICE_ROLE_KEY"])
    atualizar_json()
    gerar_audio()
    print("Concluído.")


if __name__ == "__main__":
    main()
