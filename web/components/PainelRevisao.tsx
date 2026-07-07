"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TODOS, type Kanji } from "@/lib/catalogo";

type Status = "Pendente" | "Aprovado" | "Corrigido";
type Decisao = { hiragana: string; status: Status; notas?: string };
type Mapa = Record<string, Decisao>;

const LS = "kmg_admin_decisions_v1";

// katakana -> hiragana
const kata2hira = (t: string) =>
  t.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

const R2: Record<string, string> = {
  きゃ: "kya", きゅ: "kyu", きょ: "kyo", しゃ: "sha", しゅ: "shu", しょ: "sho",
  ちゃ: "cha", ちゅ: "chu", ちょ: "cho", にゃ: "nya", にゅ: "nyu", にょ: "nyo",
  ひゃ: "hya", ひゅ: "hyu", ひょ: "hyo", みゃ: "mya", みゅ: "myu", みょ: "myo",
  りゃ: "rya", りゅ: "ryu", りょ: "ryo", ぎゃ: "gya", ぎゅ: "gyu", ぎょ: "gyo",
  じゃ: "ja", じゅ: "ju", じょ: "jo", びゃ: "bya", びゅ: "byu", びょ: "byo",
  ぴゃ: "pya", ぴゅ: "pyu", ぴょ: "pyo",
};
const R1: Record<string, string> = {
  あ: "a", い: "i", う: "u", え: "e", お: "o", か: "ka", き: "ki", く: "ku", け: "ke", こ: "ko",
  が: "ga", ぎ: "gi", ぐ: "gu", げ: "ge", ご: "go", さ: "sa", し: "shi", す: "su", せ: "se", そ: "so",
  ざ: "za", じ: "ji", ず: "zu", ぜ: "ze", ぞ: "zo", た: "ta", ち: "chi", つ: "tsu", て: "te", と: "to",
  だ: "da", ぢ: "ji", づ: "zu", で: "de", ど: "do", な: "na", に: "ni", ぬ: "nu", ね: "ne", の: "no",
  は: "ha", ひ: "hi", ふ: "fu", へ: "he", ほ: "ho", ば: "ba", び: "bi", ぶ: "bu", べ: "be", ぼ: "bo",
  ぱ: "pa", ぴ: "pi", ぷ: "pu", ぺ: "pe", ぽ: "po", ま: "ma", み: "mi", む: "mu", め: "me", も: "mo",
  や: "ya", ゆ: "yu", よ: "yo", ら: "ra", り: "ri", る: "ru", れ: "re", ろ: "ro", わ: "wa", を: "o", ん: "n", ー: "-",
};
function toRomaji(t: string): string {
  t = kata2hira(t || "");
  let o = "", i = 0;
  while (i < t.length) {
    const d = t.substr(i, 2);
    if (R2[d]) { o += R2[d]; i += 2; continue; }
    const c = t[i];
    if (c === "っ") { const n = R2[t.substr(i + 1, 2)] || R1[t[i + 1]] || ""; if (n) o += n[0]; i++; continue; }
    o += R1[c] || c; i++;
  }
  return o.toUpperCase();
}

export default function PainelRevisao() {
  const [decisoes, setDecisoes] = useState<Mapa>({});
  const [filtro, setFiltro] = useState<"review" | "pending" | "all">("review");
  const [busca, setBusca] = useState("");
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    setDecisoes(JSON.parse(localStorage.getItem(LS) || "{}"));
    const pick = () => {
      const vs = window.speechSynthesis?.getVoices() || [];
      voiceRef.current = vs.find((v) => v.lang === "ja-JP") || vs.find((v) => v.lang?.startsWith("ja")) || null;
    };
    pick();
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = pick;
  }, []);

  function persist(m: Mapa) {
    setDecisoes(m);
    localStorage.setItem(LS, JSON.stringify(m));
  }
  function decidir(k: Kanji, status: Status, hiragana: string) {
    persist({ ...decisoes, [k.id]: { hiragana: hiragana.trim(), status, notas: decisoes[k.id]?.notas || "" } });
  }
  function speak(text: string) {
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP"; if (voiceRef.current) u.voice = voiceRef.current; u.rate = 0.85;
    window.speechSynthesis.speak(u);
  }
  function playMp3(id: string) {
    new Audio(`/audio/${id}.mp3`).play().catch(() =>
      alert(`MP3 ainda não gerado para ${id}.`)
    );
  }

  const paraRevisar = useMemo(() => TODOS.filter((k) => k.needsReview), []);
  const stats = useMemo(() => {
    let ap = 0, co = 0, pe = 0;
    paraRevisar.forEach((k) => {
      const s = decisoes[k.id]?.status || "Pendente";
      if (s === "Aprovado") ap++; else if (s === "Corrigido") co++; else pe++;
    });
    return { ap, co, pe };
  }, [decisoes, paraRevisar]);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return TODOS.filter((k) => {
      if (q && !(k.kanji.includes(q) || k.significado.toLowerCase().includes(q))) return false;
      if (filtro === "review") return k.needsReview;
      if (filtro === "pending") return k.needsReview && (decisoes[k.id]?.status || "Pendente") === "Pendente";
      return true;
    });
  }, [busca, filtro, decisoes]);

  function decididas() {
    return TODOS.filter((k) => {
      const s = decisoes[k.id]?.status;
      return s === "Aprovado" || s === "Corrigido";
    }).map((k) => ({
      id: k.id,
      hiragana: decisoes[k.id].hiragana,
      romaji: toRomaji(decisoes[k.id].hiragana),
      status: decisoes[k.id].status,
      notas: decisoes[k.id].notas || "",
    }));
  }

  function exportar() {
    const out = decididas();
    if (!out.length) { alert("Nenhuma decisão para exportar ainda."); return; }
    const blob = new Blob([JSON.stringify(out, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "decisoes.json"; a.click();
  }

  async function salvarBanco() {
    const out = decididas();
    if (!out.length) { alert("Nenhuma decisão para salvar ainda."); return; }
    try {
      const res = await fetch("/api/admin/salvar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisoes: out }),
      });
      const j = await res.json();
      alert(j.ok ? `Salvo no banco: ${j.salvos} kanji(s).` : `Erro: ${j.erro}`);
    } catch (e: any) {
      alert("Falha ao salvar: " + (e?.message || e));
    }
  }

  return (
    <div>
      <div className="abar">
        <span className="astat">Total <b>{TODOS.length}</b></span>
        <span className="astat">Pendentes <b>{stats.pe}</b></span>
        <span className="astat">Aprovados <b>{stats.ap}</b></span>
        <span className="astat">Corrigidos <b>{stats.co}</b></span>
        <input className="asearch" placeholder="Buscar kanji ou significado…" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <span className="afilters">
          {(["review", "pending", "all"] as const).map((f) => (
            <button key={f} className={filtro === f ? "active" : ""} onClick={() => setFiltro(f)}>
              {f === "review" ? "A revisar" : f === "pending" ? "Só pendentes" : "Todos"}
            </button>
          ))}
        </span>
        <button className="btn ghost" onClick={exportar}>⬇ Exportar decisões</button>
        <button className="btn" onClick={salvarBanco}>☁ Salvar no banco</button>
      </div>

      <div className="agrid">
        {lista.map((k) => (
          <RCard
            key={k.id}
            k={k}
            decisao={decisoes[k.id]}
            onDecidir={decidir}
            onSpeak={speak}
            onMp3={playMp3}
          />
        ))}
        {!lista.length && <p className="rsub">Nada com este filtro/busca.</p>}
      </div>
    </div>
  );
}

function RCard({
  k, decisao, onDecidir, onSpeak, onMp3,
}: {
  k: Kanji;
  decisao?: Decisao;
  onDecidir: (k: Kanji, s: Status, h: string) => void;
  onSpeak: (t: string) => void;
  onMp3: (id: string) => void;
}) {
  const [val, setVal] = useState(decisao?.hiragana ?? k.hiragana);
  const strokeRef = useRef<HTMLDivElement>(null);
  const status = decisao?.status || "Pendente";

  useEffect(() => {
    const el = strokeRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((ents) => {
      ents.forEach((e) => {
        if (e.isIntersecting) {
          fetch(`/strokes/${k.id}.svg`).then((r) => (r.ok ? r.text() : Promise.reject()))
            .then((svg) => { el.innerHTML = svg; }).catch(() => { el.textContent = "—"; });
          obs.disconnect();
        }
      });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [k.id]);

  function setChip(reading: string) {
    const clean = kata2hira(reading.split(".")[0].replace(/-/g, "").trim());
    setVal(clean);
    onSpeak(clean);
  }

  return (
    <div className={`rcard${status === "Aprovado" ? " ap" : status === "Corrigido" ? " co" : ""}`}>
      <div className="rtop">
        <div className="rstroke" ref={strokeRef}>…</div>
        <div>
          <div className="rmean">{k.significado}</div>
          <div className="rsub">{k.mundo} · Fase {k.fase} · {k.tracos ?? "?"} traços</div>
          <div className="rsub">{k.id} &nbsp; <span className="jp" style={{ fontSize: 22 }}>{k.kanji}</span></div>
        </div>
      </div>
      <div className="rchips">
        {k.on.map((x, i) => <span key={"on" + i} className="rchip" onClick={() => setChip(x)}><span className="lab">on</span>{x}</span>)}
        {k.kun.map((x, i) => <span key={"kun" + i} className="rchip" onClick={() => setChip(x)}><span className="lab">kun</span>{x}</span>)}
        {!k.on.length && !k.kun.length && <span className="rsub">sem candidatas</span>}
      </div>
      <input className="rread jp" value={val} onChange={(e) => setVal(e.target.value)} />
      <div className="rrom">{val ? "→ " + toRomaji(val) : ""}</div>
      <div className="rbtns">
        <button onClick={() => onSpeak(val)}>🔊 Sintetizar</button>
        <button onClick={() => onMp3(k.id)}>▶ MP3 atual</button>
      </div>
      <div className="ract">
        <button className={`b-ap${status === "Aprovado" ? " sel" : ""}`} onClick={() => onDecidir(k, "Aprovado", val)}>Aprovar</button>
        <button className={`b-co${status === "Corrigido" ? " sel" : ""}`} onClick={() => onDecidir(k, "Corrigido", val)}>Corrigido</button>
        <button className={`b-pe${status === "Pendente" ? " sel" : ""}`} onClick={() => onDecidir(k, "Pendente", val)}>Pendente</button>
      </div>
    </div>
  );
}
