"use client";

import { useRef, useState, type PointerEvent } from "react";
import { btnDark, btnLight } from "@/components/app/ui";

const W = 400;
const H = 140;
type Pt = [number, number];

/** SVG path data for a set of pen strokes. A single tap becomes a dot. */
const pathOf = (strokes: Pt[][]) =>
  strokes
    .map((s) =>
      s.length === 1
        ? `M${s[0][0]} ${s[0][1]}l0.1 0.1`
        : `M${s.map((p) => `${p[0]} ${p[1]}`).join("L")}`,
    )
    .join("");

/** A drawn signature, shown from its saved path. */
export function SignatureView({
  path,
  className = "h-14 w-auto",
}: {
  path: string;
  className?: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      role="img"
      aria-label="Signature"
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Draw a signature with a finger, pen or mouse. Saves the strokes as SVG path data. */
export function SignaturePad({
  name,
  onSave,
  onCancel,
  saveLabel = "Save signature",
}: {
  name: string;
  onSave: (path: string) => void;
  onCancel?: () => void;
  saveLabel?: string;
}) {
  const [strokes, setStrokes] = useState<Pt[][]>([]);
  const drawing = useRef(false);
  const box = useRef<SVGSVGElement>(null);
  const points = strokes.reduce((n, s) => n + s.length, 0);

  const at = (e: PointerEvent<SVGSVGElement>): Pt => {
    const r = box.current!.getBoundingClientRect();
    return [
      Math.round(((e.clientX - r.left) / r.width) * W * 10) / 10,
      Math.round(((e.clientY - r.top) / r.height) * H * 10) / 10,
    ];
  };

  const end = () => {
    drawing.current = false;
  };

  return (
    <div>
      <p className="mb-2 text-sm font-medium">
        {name}, draw your signature in the box
      </p>
      <svg
        ref={box}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Signature box. Draw with a finger, pen or mouse."
        className="w-full cursor-crosshair touch-none select-none rounded-xl border border-dashed border-ink-soft/60 bg-surface"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drawing.current = true;
          const p = at(e);
          setStrokes((s) => [...s, [p]]);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const p = at(e);
          setStrokes((s) => {
            const last = s[s.length - 1];
            return last ? [...s.slice(0, -1), [...last, p]] : s;
          });
        }}
        onPointerUp={end}
        onPointerCancel={end}
        onPointerLeave={end}
      >
        <line
          x1="16"
          y1="108"
          x2={W - 16}
          y2="108"
          stroke="currentColor"
          strokeOpacity="0.2"
          strokeWidth="1"
        />
        <text x="16" y="126" fontSize="11" fill="currentColor" opacity="0.45">
          Sign above the line
        </text>
        <path
          d={pathOf(strokes)}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setStrokes([])}
          disabled={points === 0}
          className={`${btnLight} disabled:opacity-40`}
        >
          Clear
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={btnLight}>
            Cancel
          </button>
        )}
        <button
          type="button"
          disabled={points < 6}
          onClick={() => onSave(pathOf(strokes))}
          className={`${btnDark} disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {saveLabel}
        </button>
      </div>
    </div>
  );
}
