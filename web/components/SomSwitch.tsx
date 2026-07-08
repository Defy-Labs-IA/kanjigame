"use client";

import { useEffect, useState } from "react";

const KEY = "kmg_som";
const EVT = "kmg-som";

/** Preferência de som ao virar carta (on/off), sincronizada via evento + localStorage. */
export function useSom(): [boolean, (v: boolean) => void] {
  const [som, setSomState] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    setSomState(stored ? stored === "on" : true);
    const h = (e: Event) => setSomState((e as CustomEvent).detail as boolean);
    window.addEventListener(EVT, h);
    return () => window.removeEventListener(EVT, h);
  }, []);

  const set = (v: boolean) => {
    localStorage.setItem(KEY, v ? "on" : "off");
    setSomState(v);
    window.dispatchEvent(new CustomEvent(EVT, { detail: v }));
  };

  return [som, set];
}

export default function SomSwitch() {
  const [som, setSom] = useSom();
  return (
    <button
      className={`ctrl-btn${som ? " on" : ""}`}
      onClick={() => setSom(!som)}
      title={som ? "Som ligado" : "Mudo"}
      aria-label={som ? "Desligar som" : "Ligar som"}
      aria-pressed={som}
    >
      {som ? "🔊" : "🔇"}
    </button>
  );
}
