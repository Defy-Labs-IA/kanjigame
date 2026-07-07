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

export default function ModoSwitch() {
  const [modo, setModo] = useModo();
  return (
    <div className="modoswitch" role="tablist" aria-label="Modo de jogo">
      <button
        className={modo === "facil" ? "on" : ""}
        onClick={() => setModo("facil")}
        aria-selected={modo === "facil"}
      >
        😊 Fácil
      </button>
      <button
        className={modo === "avancado" ? "on" : ""}
        onClick={() => setModo("avancado")}
        aria-selected={modo === "avancado"}
      >
        🔥 Avançado
      </button>
      <button
        className={modo === "superavancado" ? "on" : ""}
        onClick={() => setModo("superavancado")}
        aria-selected={modo === "superavancado"}
      >
        ✍️ Superavançado
      </button>
    </div>
  );
}
