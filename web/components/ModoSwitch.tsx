"use client";

import { useEffect, useState } from "react";

export type Modo = "facil" | "avancado" | "superavancado";

const KEY = "kmg_modo";
const EVT = "kmg-modo";

/** Lê/escreve o modo, sincronizando todas as instâncias via evento + localStorage. */
export function useModo(): [Modo, (m: Modo) => void] {
  const [modo, setModoState] = useState<Modo>("facil");

  useEffect(() => {
    const stored = (localStorage.getItem(KEY) as Modo) || "facil";
    setModoState(stored);
    const h = (e: Event) => setModoState((e as CustomEvent).detail as Modo);
    window.addEventListener(EVT, h);
    return () => window.removeEventListener(EVT, h);
  }, []);

  const set = (m: Modo) => {
    localStorage.setItem(KEY, m);
    setModoState(m);
    window.dispatchEvent(new CustomEvent(EVT, { detail: m }));
  };

  return [modo, set];
}

const OPCOES: { modo: Modo; emoji: string; titulo: string }[] = [
  { modo: "facil", emoji: "😊", titulo: "Fácil" },
  { modo: "avancado", emoji: "🔥", titulo: "Avançado" },
  { modo: "superavancado", emoji: "✍️", titulo: "Superavançado" },
];

export default function ModoSwitch() {
  const [modo, setModo] = useModo();
  return (
    <div className="ctrls" role="tablist" aria-label="Modo de jogo">
      {OPCOES.map((o) => (
        <button
          key={o.modo}
          className={`ctrl-btn${modo === o.modo ? " on" : ""}`}
          onClick={() => setModo(o.modo)}
          aria-selected={modo === o.modo}
          title={o.titulo}
          aria-label={`Modo ${o.titulo}`}
        >
          {o.emoji}
        </button>
      ))}
    </div>
  );
}
