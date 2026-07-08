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
    <div className="modoswitch" role="tablist" aria-label="Som">
      <button className={som ? "on" : ""} onClick={() => setSom(true)} aria-selected={som}>
        🔊 Som
      </button>
      <button className={!som ? "on" : ""} onClick={() => setSom(false)} aria-selected={!som}>
        🔇 Mudo
      </button>
    </div>
  );
}
