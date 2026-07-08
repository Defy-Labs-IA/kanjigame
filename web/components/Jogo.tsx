"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Kanji } from "@/lib/catalogo";
import ModoSwitch, { useModo } from "@/components/ModoSwitch";
import SomSwitch, { useSom } from "@/components/SomSwitch";
import PadDesenho from "@/components/PadDesenho";
import { extrairRefStrokes, type Stroke } from "@/lib/tracado";

type Carta = { uid: string; k: Kanji };
type Coluna = Carta[];

function tocarKanji(id: string) {
  const a = new Audio(`/audio/${id}.mp3`);
  a.play().catch(() => {});
}

function embaralhar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function montarColunas(kanjis: Kanji[]): Coluna[] {
  // 2 cartas por kanji -> embaralha -> 4 colunas
  const cartas: Carta[] = [];
  kanjis.forEach((k, i) => {
    cartas.push({ uid: `${k.id}-a-${i}`, k });
    cartas.push({ uid: `${k.id}-b-${i}`, k });
  });
  const mix = embaralhar(cartas);
  const nCols = 4;
  const cols: Coluna[] = Array.from({ length: nCols }, () => []);
  mix.forEach((c, i) => cols[i % nCols].push(c));
  return cols;
}

export default function Jogo({
  kanjis,
  faseNome,
}: {
  kanjis: Kanji[];
  faseNome: string;
}) {
  // Embaralhamento so no cliente (evita hydration mismatch por causa do Math.random no SSR)
  const [colunas, setColunas] = useState<Coluna[]>([]);
  useEffect(() => {
    setColunas(montarColunas(kanjis));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [abertas, setAbertas] = useState<string[]>([]); // uids viradas
  const [combinadas, setCombinadas] = useState<Set<string>>(new Set());
  const [travado, setTravado] = useState(false);
  const [pontos, setPontos] = useState(100);
  const [erros, setErros] = useState(0);
  const [sequencia, setSequencia] = useState(0);
  const [licao, setLicao] = useState<Kanji | null>(null);
  const [fim, setFim] = useState(false);
  const [modo] = useModo();
  const [som] = useSom();

  const totalPares = kanjis.length;
  const paresFeitos = combinadas.size / 2;

  const porUid = useMemo(() => {
    const m = new Map<string, Carta>();
    colunas.flat().forEach((c) => m.set(c.uid, c));
    return m;
  }, [colunas]);

  function novoJogo() {
    setColunas(montarColunas(kanjis));
    setAbertas([]);
    setCombinadas(new Set());
    setTravado(false);
    setPontos(100);
    setErros(0);
    setSequencia(0);
    setLicao(null);
    setFim(false);
  }

  function clicar(uid: string) {
    if (travado || licao) return;
    if (abertas.includes(uid) || combinadas.has(uid)) return;
    // Som ao virar carta (todos os modos, se o jogador deixou o som ligado)
    if (som) {
      const carta = porUid.get(uid);
      if (carta) tocarKanji(carta.k.id);
    }
    const novas = [...abertas, uid];
    setAbertas(novas);
    if (novas.length === 2) avaliar(novas);
  }

  function avaliar(par: string[]) {
    setTravado(true);
    const [a, b] = par.map((u) => porUid.get(u)!);
    if (a.k.id === b.k.id) {
      // acerto -> microaula
      const streak = sequencia + 1;
      setSequencia(streak);
      let bonus = 0;
      if (streak === 3) bonus = 1;
      if (streak >= 5) bonus = 2;
      if (bonus) setPontos((p) => Math.min(100, p + bonus));
      setTimeout(() => setLicao(a.k), 450);
    } else {
      // erro
      setErros((e) => e + 1);
      setSequencia(0);
      setPontos((p) => p - 1);
      setTimeout(() => {
        setAbertas([]);
        setTravado(false);
      }, 1000);
    }
  }

  function concluirLicao() {
    const par = abertas;
    setCombinadas((prev) => {
      const s = new Set(prev);
      par.forEach((u) => s.add(u));
      return s;
    });
    // Avançado/Superavançado: cartas acima descem. Fácil: mantêm as posições.
    if (modo !== "facil") {
      setColunas((cols) =>
        cols.map((col) => col.filter((c) => !par.includes(c.uid)))
      );
    }
    setAbertas([]);
    setLicao(null);
    setTravado(false);
  }

  useEffect(() => {
    if (paresFeitos === totalPares && totalPares > 0) {
      const t = setTimeout(() => setFim(true), 400);
      return () => clearTimeout(t);
    }
  }, [paresFeitos, totalPares]);

  if (fim) {
    return <Resultado pontos={pontos} erros={erros} onReplay={novoJogo} />;
  }

  return (
    <div>
      <div className="topbar">
        <ModoSwitch />
        <span className="ctrl-sep" />
        <SomSwitch />
      </div>
      <h2 style={{ textAlign: "center", marginTop: 0 }}>{faseNome}</h2>
      <div className="hud">
        <span className="pill">
          Pontos <b>{pontos}</b>
        </span>
        <span className="pill">
          Pares <b>{paresFeitos}</b>/{totalPares}
        </span>
        <span className="pill">Erros {erros}</span>
        {sequencia >= 2 && <span className="pill">🔥 Combo {sequencia}</span>}
      </div>

      <div className="board">
        {colunas.map((col, ci) => (
          <div className="col" key={ci}>
            {col.map((c) => {
              const up = abertas.includes(c.uid) || combinadas.has(c.uid);
              const matched = combinadas.has(c.uid);
              return (
                <button
                  key={c.uid}
                  className={`card${up ? " up" : ""}${matched ? " matched" : ""}`}
                  onClick={() => clicar(c.uid)}
                  aria-label={up ? c.k.kanji : "carta virada"}
                >
                  <span className="inner">
                    <span className="face back jp">漢</span>
                    <span className="face front jp">{c.k.kanji}</span>
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {licao && (
        <Microaula
          k={licao}
          onClose={concluirLicao}
          speedUp={modo !== "facil"}
          draw={modo === "superavancado"}
        />
      )}
    </div>
  );
}

function Microaula({
  k,
  onClose,
  speedUp,
  draw,
}: {
  k: Kanji;
  onClose: () => void;
  speedUp: boolean;
  draw: boolean;
}) {
  const strokeRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [mostrarPad, setMostrarPad] = useState(false);
  const [refStrokes, setRefStrokes] = useState<Stroke[]>([]);

  function tocarAudio() {
    if (!audioRef.current) {
      audioRef.current = new Audio(`/audio/${k.id}.mp3`);
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }

  function carregarTracos() {
    const el = strokeRef.current;
    if (!el) return;
    fetch(`/strokes/${k.id}.svg`)
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((svg) => {
        // Avançado/Super: acelera a animação em 50% (duração --t e atrasos --d ÷ 1.5)
        if (speedUp) {
          svg = svg.replace(
            /--([td]):\s*([\d.]+)s/g,
            (_m, v, n) => `--${v}:${(parseFloat(n) / 1.5).toFixed(3)}s`
          );
        }
        el.innerHTML = svg;
        // Super: extrai os traços de referência e revela o quadro após a animação
        if (draw) {
          const svgEl = el.querySelector("svg");
          if (svgEl) setRefStrokes(extrairRefStrokes(svgEl as unknown as SVGSVGElement));
          const nStrokes = (svg.match(/clip-path="url/g) || []).length;
          const dur = speedUp ? 1.5 : 1;
          const totalMs = ((nStrokes + 0.8) / dur) * 1000 + 200;
          setTimeout(() => setMostrarPad(true), totalMs);
        }
      })
      .catch(() => {
        el.textContent = "";
      });
  }

  useEffect(() => {
    carregarTracos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="lesson" onClick={(e) => e.stopPropagation()}>
        <div className="big jp">{k.kanji}</div>
        <div className="stroke" ref={strokeRef} />
        {draw && mostrarPad && (
          <div className="pad-secao">
            <div className="pad-titulo">✍️ Sua vez — treine o traçado</div>
            <PadDesenho guia={k.kanji} refStrokes={refStrokes} />
          </div>
        )}
        <div className="read jp">{k.hiragana}</div>
        <div className="rom">{k.romaji}</div>
        <div className="mean">{k.significado}</div>
        <div className="row">
          <button className="btn turq" onClick={tocarAudio}>
            🔊 Ouvir
          </button>
          <button
            className="btn ghost"
            onClick={() => {
              if (strokeRef.current) strokeRef.current.innerHTML = "";
              carregarTracos();
            }}
          >
            ↻ Traços
          </button>
        </div>
        <div className="row">
          <button className="btn" onClick={onClose}>
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}

function Resultado({
  pontos,
  erros,
  onReplay,
}: {
  pontos: number;
  erros: number;
  onReplay: () => void;
}) {
  const estrelas = pontos >= 100 ? 3 : pontos >= 95 ? 3 : pontos >= 85 ? 2 : pontos >= 70 ? 1 : 0;
  const classe =
    pontos >= 100
      ? "Mestre da Memória"
      : pontos >= 95
      ? "Excelente"
      : pontos >= 85
      ? "Muito bom"
      : pontos >= 70
      ? "Bom progresso"
      : pontos >= 50
      ? "Continue praticando"
      : "Vamos tentar novamente";
  return (
    <div className="result">
      <div className="stars">{"★".repeat(estrelas)}{"☆".repeat(3 - estrelas)}</div>
      <div className="score">{pontos}</div>
      <p>
        {classe} · {erros} erro(s)
      </p>
      <div className="actions">
        <button className="btn" onClick={onReplay}>
          Jogar de novo
        </button>
        <a className="btn ghost" href="/">
          Início
        </a>
      </div>
    </div>
  );
}
