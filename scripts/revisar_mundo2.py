# -*- coding: utf-8 -*-
"""
revisar_mundo2.py — Fases 6-10 / Mundo 2 (Natureza), K051-K100.
Aplica leituras revisadas no Supabase + catalogo.json e gera os MP3 (edge-tts).
Mesma lógica de revisar_fases_2a5.py.
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

LEITURAS = {
    "K051": "さき", "K052": "せん", "K053": "かわ", "K054": "はやい", "K055": "くさ",
    "K056": "あし", "K057": "むら", "K058": "おおきい", "K059": "おとこ", "K060": "たけ",
    "K061": "なか", "K062": "むし", "K063": "まち", "K064": "てん", "K065": "た",
    "K066": "つち", "K067": "ひ", "K068": "はいる", "K069": "とし", "K070": "しろ",
    "K071": "ひゃく", "K072": "ぶん", "K073": "ほん", "K074": "な", "K075": "き",
    "K076": "め", "K077": "ゆう", "K078": "たつ", "K079": "ちから", "K080": "はやし",
    "K081": "ひく", "K082": "はね", "K083": "くも", "K084": "えん", "K085": "とおい",
    "K086": "き", "K087": "なに", "K088": "なつ", "K089": "いえ", "K090": "か",
    "K091": "うた", "K092": "が", "K093": "かい", "K094": "かい", "K095": "うみ",
    "K096": "え", "K097": "そと", "K098": "かど", "K099": "たのしい", "K100": "かつ",
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
    for kid, hira in LEITURAS.items():
        payload = {"hiragana": hira, "romaji": hiragana_to_romaji(hira),
                   "status": "Validado (revisor)", "needs_review": False}
        req = urllib.request.Request(
            f"{url}/rest/v1/kanji?id=eq.{kid}", data=json.dumps(payload).encode("utf-8"),
            method="PATCH", headers={"apikey": sr, "Authorization": f"Bearer {sr}",
                                     "Content-Type": "application/json", "Prefer": "return=minimal"})
        urllib.request.urlopen(req).read()
    print(f"DB atualizado: {len(LEITURAS)} leituras")


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
    for kid, hira in LEITURAS.items():
        subprocess.run([sys.executable, "-m", "edge_tts", "--voice", VOZ, "--text", hira,
                        "--write-media", str(AUDIO_DIR / f"{kid}.mp3")], check=True, capture_output=True)
    print(f"Áudio gerado: {len(LEITURAS)} MP3")


def main():
    env = ler_env()
    atualizar_db(env["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/"), env["SUPABASE_SERVICE_ROLE_KEY"])
    atualizar_json()
    gerar_audio()
    print("Concluído.")


if __name__ == "__main__":
    main()
