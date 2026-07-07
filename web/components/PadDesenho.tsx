"use client";

import { useEffect, useRef, useState } from "react";
import { pontuar, type Resultado, type Stroke } from "@/lib/tracado";

/**
 * Quadro de treino de traçado. Grava cada traço como sequência de pontos e dá uma
 * nota simples (Fase 2) comparando com os traços de referência do KanjiVG.
 * Usa Pointer Events (mouse + toque + caneta) e touch-action:none para funcionar
 * naturalmente em tablet/celular sem rolar a página ao desenhar.
 */
export default function PadDesenho({
  guia,
  refStrokes,
  tamanho = 176,
}: {
  guia: string;
  refStrokes: Stroke[];
  tamanho?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const desenhando = useRef(false);
  const tracos = useRef<Stroke[]>([]); // todos os traços do usuário
  const atual = useRef<Stroke>([]); // traço em andamento
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = tamanho * dpr;
    canvas.height = tamanho * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#3a3a42";
  }, [tamanho]);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function inicio(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* alguns navegadores/pointers podem recusar a captura; segue sem ela */
    }
    desenhando.current = true;
    const p = pos(e);
    atual.current = [p];
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }
  function mover(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!desenhando.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const p = pos(e);
    atual.current.push(p);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
  function fim() {
    if (desenhando.current && atual.current.length > 1) {
      tracos.current.push(atual.current);
    }
    atual.current = [];
    desenhando.current = false;
  }
  function limpar() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    tracos.current = [];
    atual.current = [];
    setResultado(null);
  }
  function avaliar() {
    if (!tracos.current.length) {
      setResultado(null);
      return;
    }
    setResultado(pontuar(tracos.current, refStrokes));
  }

  const cor =
    resultado?.nota === "Muito bom"
      ? "var(--ok)"
      : resultado?.nota === "Bom"
      ? "var(--turq)"
      : "var(--coral)";

  return (
    <div className="pad-wrap">
      <div className="pad" style={{ width: tamanho, height: tamanho }}>
        <span className="pad-guia jp" aria-hidden>
          {guia}
        </span>
        <canvas
          ref={canvasRef}
          className="pad-canvas"
          style={{ width: tamanho, height: tamanho }}
          onPointerDown={inicio}
          onPointerMove={mover}
          onPointerUp={fim}
          onPointerLeave={fim}
          onPointerCancel={fim}
        />
      </div>

      <div className="pad-acoes">
        <button className="btn ghost" type="button" onClick={limpar}>
          🧹 Limpar
        </button>
        <button className="btn turq" type="button" onClick={avaliar}>
          ✓ Avaliar
        </button>
      </div>

      {resultado && (
        <div className="pad-nota" style={{ color: cor }}>
          <strong>{resultado.nota}</strong> · {resultado.score}/100
          <span className="pad-nota-sub">
            {" "}
            (traços: {resultado.uCount}/{resultado.rCount})
          </span>
        </div>
      )}
    </div>
  );
}
