# -*- coding: utf-8 -*-
"""Fases 11-20 / Mundos 3-4 (K101-K200). Aplica leituras + gera áudio."""
import json, subprocess, sys, urllib.request
from pathlib import Path
from kanji_common import hiragana_to_romaji

RAIZ = Path(__file__).resolve().parent.parent
ENV = RAIZ / "web" / ".env.local"
AUDIO_DIR = RAIZ / "web" / "public" / "audio"
JSONS = [RAIZ / "web" / "data" / "catalogo.json", RAIZ / "web" / "public" / "data" / "catalogo.json"]
VOZ = "ja-JP-NanamiNeural"

LEITURAS = {
    "K101": "あいだ", "K102": "まる", "K103": "いわ", "K104": "かお", "K105": "かえる",
    "K106": "き", "K107": "き", "K108": "ゆみ", "K109": "うし", "K110": "さかな",
    "K111": "きょう", "K112": "つよい", "K113": "おしえる", "K114": "ちかい", "K115": "あに",
    "K116": "かたち", "K117": "はかる", "K118": "もと", "K119": "はら", "K120": "いう",
    "K121": "ふるい", "K122": "と", "K123": "ご", "K124": "あと", "K125": "ご",
    "K126": "こう", "K127": "ひかり", "K128": "こう", "K129": "こう", "K130": "ひろい",
    "K131": "かんがえる", "K132": "いく", "K133": "たかい", "K134": "あう", "K135": "くに",
    "K136": "くろ", "K137": "いま", "K138": "さい", "K139": "ほそい", "K140": "つくる",
    "K141": "さん", "K142": "あね", "K143": "し", "K144": "おもう", "K145": "とまる",
    "K146": "かみ", "K147": "てら", "K148": "とき", "K149": "じ", "K150": "しつ",
    "K151": "しゃ", "K152": "よわい", "K153": "くび", "K154": "あき", "K155": "しゅう",
    "K156": "はる", "K157": "かく", "K158": "すくない", "K159": "ば", "K160": "いろ",
    "K161": "たべる", "K162": "こころ", "K163": "あたらしい", "K164": "おや", "K165": "ず",
    "K166": "かず", "K167": "ほし", "K168": "はれ", "K169": "こえ", "K170": "にし",
    "K171": "きる", "K172": "ゆき", "K173": "せん", "K174": "ふね", "K175": "まえ",
    "K176": "くみ", "K177": "はしる", "K178": "おおい", "K179": "ふとい", "K180": "からだ",
    "K181": "だい", "K182": "たに", "K183": "しる", "K184": "ち", "K185": "いけ",
    "K186": "ちゃ", "K187": "ひる", "K188": "あさ", "K189": "ながい", "K190": "とり",
    "K191": "なおす", "K192": "とおる", "K193": "おとうと", "K194": "みせ", "K195": "てん",
    "K196": "でん", "K197": "ふゆ", "K198": "かたな", "K199": "ひがし", "K200": "あたる",
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
