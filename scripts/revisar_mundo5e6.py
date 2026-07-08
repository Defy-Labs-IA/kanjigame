# -*- coding: utf-8 -*-
"""Fases 21-30 / Mundos 5-6 (K201-K300). Aplica leituras + gera áudio."""
import json, subprocess, sys, urllib.request
from pathlib import Path
from kanji_common import hiragana_to_romaji

RAIZ = Path(__file__).resolve().parent.parent
ENV = RAIZ / "web" / ".env.local"
AUDIO_DIR = RAIZ / "web" / "public" / "audio"
JSONS = [RAIZ / "web" / "data" / "catalogo.json", RAIZ / "web" / "public" / "data" / "catalogo.json"]
VOZ = "ja-JP-NanamiNeural"

LEITURAS = {
    "K201": "こたえ", "K202": "あたま", "K203": "おなじ", "K204": "みち", "K205": "よむ",
    "K206": "うち", "K207": "みなみ", "K208": "にく", "K209": "うま", "K210": "かう",
    "K211": "うる", "K212": "むぎ", "K213": "はん", "K214": "ばん", "K215": "ちち",
    "K216": "かぜ", "K217": "きく", "K218": "こめ", "K219": "あるく", "K220": "はは",
    "K221": "ほう", "K222": "きた", "K223": "いもうと", "K224": "まい", "K225": "まん",
    "K226": "あかるい", "K227": "なく", "K228": "け", "K229": "もん", "K230": "よる",
    "K231": "の", "K232": "や", "K233": "とも", "K234": "よう", "K235": "よう",
    "K236": "くる", "K237": "り", "K238": "はなす", "K239": "わるい", "K240": "やすい",
    "K241": "くらい", "K242": "い", "K243": "い", "K244": "い", "K245": "そだてる",
    "K246": "いん", "K247": "のむ", "K248": "いん", "K249": "はこぶ", "K250": "およぐ",
    "K251": "えき", "K252": "おう", "K253": "よこ", "K254": "や", "K255": "あたたかい",
    "K256": "か", "K257": "に", "K258": "かい", "K259": "ひらく", "K260": "かい",
    "K261": "さむい", "K262": "かん", "K263": "かん", "K264": "かん", "K265": "きし",
    "K266": "き", "K267": "おきる", "K268": "きゃく", "K269": "みや", "K270": "いそぐ",
    "K271": "きゅう", "K272": "きゅう", "K273": "きゅう", "K274": "さる", "K275": "はし",
    "K276": "ぎょう", "K277": "きょく", "K278": "きょく", "K279": "ぎん", "K280": "く",
    "K281": "くるしい", "K282": "ぐ", "K283": "きみ", "K284": "かかり", "K285": "かるい",
    "K286": "きめる", "K287": "ち", "K288": "けん", "K289": "けん", "K290": "こ",
    "K291": "みずうみ", "K292": "むく", "K293": "しあわせ", "K294": "みなと", "K295": "ごう",
    "K296": "ね", "K297": "まつり", "K298": "さか", "K299": "さら", "K300": "し",
}


def ler_env():
    env = {}
    for l in ENV.read_text(encoding="utf-8").splitlines():
        l = l.strip()
        if l and not l.startswith("#") and "=" in l:
            k, v = l.split("=", 1); env[k.strip()] = v.strip()
    return env


def atualizar_db(url, sr):
    for kid, hira in LEITURAS.items():
        payload = {"hiragana": hira, "romaji": hiragana_to_romaji(hira),
                   "status": "Validado (revisor)", "needs_review": False}
        req = urllib.request.Request(f"{url}/rest/v1/kanji?id=eq.{kid}", data=json.dumps(payload).encode("utf-8"),
            method="PATCH", headers={"apikey": sr, "Authorization": f"Bearer {sr}",
                                     "Content-Type": "application/json", "Prefer": "return=minimal"})
        urllib.request.urlopen(req).read()
    print(f"DB: {len(LEITURAS)} leituras")


def atualizar_json():
    for jp in JSONS:
        if not jp.exists(): continue
        dados = json.loads(jp.read_text(encoding="utf-8"))
        for k in dados:
            if k["id"] in LEITURAS:
                k["hiragana"] = LEITURAS[k["id"]]; k["romaji"] = hiragana_to_romaji(LEITURAS[k["id"]])
                k["needsReview"] = False; k["status"] = "Validado (revisor)"
        jp.write_text(json.dumps(dados, ensure_ascii=False, indent=1), encoding="utf-8")
    print("catalogo.json atualizado")


def gerar_audio():
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    for kid, hira in LEITURAS.items():
        subprocess.run([sys.executable, "-m", "edge_tts", "--voice", VOZ, "--text", hira,
                        "--write-media", str(AUDIO_DIR / f"{kid}.mp3")], check=True, capture_output=True)
    print(f"Áudio: {len(LEITURAS)} MP3")


def main():
    env = ler_env()
    atualizar_db(env["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/"), env["SUPABASE_SERVICE_ROLE_KEY"])
    atualizar_json(); gerar_audio(); print("Concluído.")


if __name__ == "__main__":
    main()
