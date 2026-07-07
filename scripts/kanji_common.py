# -*- coding: utf-8 -*-
"""
Utilitarios compartilhados pelos scripts do Kanji Memory Game.
Sem dependencias externas alem de openpyxl (usado apenas nos scripts que abrem a planilha).
"""
import json
import time
import urllib.request
import urllib.parse
from pathlib import Path

# ---------------------------------------------------------------------------
# Layout da planilha Catalogo_300 (colunas 1-based, linha 1 = cabecalho)
# ---------------------------------------------------------------------------
SHEET_NAME = "Catalogo_300"
COL = {
    "id": 1,            # A  K001...
    "kanji": 2,         # B  一
    "significado": 3,   # C  Um            (PT-BR, ja preenchido)
    "hiragana": 4,      # D  Leitura principal (hiragana)
    "romaji": 5,        # E  Romaji principal
    "onyomi": 6,        # F  On'yomi
    "kunyomi": 7,       # G  Kun'yomi
    "tracos": 8,        # H  N de tracos
    "grau": 9,          # I  Grau escolar JP
    "status": 17,       # Q  Status editorial
    "obs": 20,          # T  Observacoes do revisor
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (KanjiMemoryGame data pipeline; educational, non-commercial fetch)"
}


def http_get(url, timeout=20, retries=3, backoff=1.5):
    """GET simples com User-Agent (kanjiapi bloqueia o UA padrao do urllib)."""
    last = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read()
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(backoff * (attempt + 1))
    raise last


def http_get_json(url, **kw):
    return json.loads(http_get(url, **kw).decode("utf-8"))


# ---------------------------------------------------------------------------
# Conversores de kana
# ---------------------------------------------------------------------------
def katakana_to_hiragana(text):
    out = []
    for ch in text:
        code = ord(ch)
        # bloco katakana 0x30A1-0x30F6 -> hiragana subtraindo 0x60
        if 0x30A1 <= code <= 0x30F6:
            out.append(chr(code - 0x60))
        else:
            out.append(ch)
    return "".join(out)


# Tabela Hepburn (hiragana -> romaji). Digrafos primeiro.
_ROMAJI = {
    "きゃ": "kya", "きゅ": "kyu", "きょ": "kyo",
    "しゃ": "sha", "しゅ": "shu", "しょ": "sho",
    "ちゃ": "cha", "ちゅ": "chu", "ちょ": "cho",
    "にゃ": "nya", "にゅ": "nyu", "にょ": "nyo",
    "ひゃ": "hya", "ひゅ": "hyu", "ひょ": "hyo",
    "みゃ": "mya", "みゅ": "myu", "みょ": "myo",
    "りゃ": "rya", "りゅ": "ryu", "りょ": "ryo",
    "ぎゃ": "gya", "ぎゅ": "gyu", "ぎょ": "gyo",
    "じゃ": "ja", "じゅ": "ju", "じょ": "jo",
    "ぢゃ": "ja", "ぢゅ": "ju", "ぢょ": "jo",
    "びゃ": "bya", "びゅ": "byu", "びょ": "byo",
    "ぴゃ": "pya", "ぴゅ": "pyu", "ぴょ": "pyo",
    "あ": "a", "い": "i", "う": "u", "え": "e", "お": "o",
    "か": "ka", "き": "ki", "く": "ku", "け": "ke", "こ": "ko",
    "が": "ga", "ぎ": "gi", "ぐ": "gu", "げ": "ge", "ご": "go",
    "さ": "sa", "し": "shi", "す": "su", "せ": "se", "そ": "so",
    "ざ": "za", "じ": "ji", "ず": "zu", "ぜ": "ze", "ぞ": "zo",
    "た": "ta", "ち": "chi", "つ": "tsu", "て": "te", "と": "to",
    "だ": "da", "ぢ": "ji", "づ": "zu", "で": "de", "ど": "do",
    "な": "na", "に": "ni", "ぬ": "nu", "ね": "ne", "の": "no",
    "は": "ha", "ひ": "hi", "ふ": "fu", "へ": "he", "ほ": "ho",
    "ば": "ba", "び": "bi", "ぶ": "bu", "べ": "be", "ぼ": "bo",
    "ぱ": "pa", "ぴ": "pi", "ぷ": "pu", "ぺ": "pe", "ぽ": "po",
    "ま": "ma", "み": "mi", "む": "mu", "め": "me", "も": "mo",
    "や": "ya", "ゆ": "yu", "よ": "yo",
    "ら": "ra", "り": "ri", "る": "ru", "れ": "re", "ろ": "ro",
    "わ": "wa", "ゐ": "wi", "ゑ": "we", "を": "o", "ん": "n",
    "ー": "-",
}


def hiragana_to_romaji(text):
    """Conversao Hepburn simplificada. Trata っ (sokuon) e vogais longas basicas."""
    text = katakana_to_hiragana(text)
    out = []
    i = 0
    n = len(text)
    while i < n:
        # digrafo (2 chars)
        if i + 1 < n and text[i:i + 2] in _ROMAJI:
            out.append(_ROMAJI[text[i:i + 2]])
            i += 2
            continue
        ch = text[i]
        # sokuon: dobra a proxima consoante
        if ch == "っ":
            if i + 1 < n:
                nxt = text[i + 1:i + 3] if text[i + 1:i + 3] in _ROMAJI else text[i + 1]
                r = _ROMAJI.get(nxt, "")
                if r:
                    out.append(r[0])
            i += 1
            continue
        out.append(_ROMAJI.get(ch, ch))
        i += 1
    return "".join(out).upper()


def clean_kun(reading):
    """Remove marcadores de okurigana das leituras kun do KANJIDIC: ひと.つ -> ひと ; ひと- -> ひと."""
    return reading.split(".")[0].replace("-", "").strip()


# ---------------------------------------------------------------------------
# Planilha
# ---------------------------------------------------------------------------
def default_workbook():
    return Path(__file__).resolve().parent.parent / "Kanji_Memory_Game_Catalogo_300_v1.xlsx"


def iter_catalog_rows(ws):
    """Gera (row_index, dict) para cada linha de dados com kanji preenchido."""
    for r in range(2, ws.max_row + 1):
        kanji = ws.cell(r, COL["kanji"]).value
        if not kanji:
            continue
        yield r, {name: ws.cell(r, idx).value for name, idx in COL.items()}
