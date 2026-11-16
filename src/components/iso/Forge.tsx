"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "../Icons";
import { CATALOGUE, docNumber } from "@/lib/iso/catalogue";
import { mdToHtml, wordCount } from "@/lib/iso/markdown";
import { STANDARDS } from "@/lib/iso/standards";
import { docKey, type IsoFacts, type IsoStd } from "@/lib/iso/types";

/** A number that eases up to its target instead of jumping. */
function useCountUp(target: number, ms = 450) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const e = 1 - Math.pow(1 - t, 3);
      const val = Math.round(a + (target - a) * e);
      setV(val);
      from.current = val;
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

const STAGES: { label: string; heading?: RegExp }[] = [
  { label: "Reading your business" },
  { label: "Pulling your records" },
  { label: "Purpose and scope", heading: /purpose|scope|document control/i },
  { label: "Responsibilities", heading: /definitions|responsibilit/i },
  { label: "The substance", heading: /procedure|policy statement|the plan|content|how this|how to complete|register$|current position|currently|projects in scope|subcontractors currently|incidents on|competence evidence|chemicals on|plant and/i },
  { label: "Records and measures", heading: /records|performance/i },
  { label: "Auditor evidence and clauses", heading: /auditor|clause|related/i },
  { label: "Final checks", heading: /revision/i },
];

/** Which stage the document is in, read from the headings written so far. */
function stageOf(text: string) {
  if (!text) return 0;
  let idx = text.length < 220 ? 1 : 2;
  const heads = [...text.matchAll(/^#{2,3}\s+(?:\d+\.\s*)?(.*)$/gm)].map((m) => m[1]);
  for (const h of heads)
    STAGES.forEach((s, i) => {
      if (s.heading && s.heading.test(h) && i > idx) idx = i;
    });
  return idx;
}

/** The last few lines being written, shown faint and monospaced like a terminal. */
const tail = (text: string, n = 6) =>
  text
    .split("\n")
    .map((l) => l.replace(/[|#*`]/g, " ").replace(/\s+/g, " ").trim())
    .filter((l) => l && !/^-+$/.test(l))
    .slice(-n);

/* ---------- one document ---------- */

export function WritingStage({
  title,
  no,
  text,
  facts,
}: {
  title: string;
  no: string;
  text: string;
  facts: IsoFacts;
}) {
  // The text already arrives a few characters at a time, so the count is shown as it is, with no easing to lag behind.
  const words = wordCount(text);
  const stage = stageOf(text);
  const paper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = paper.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [text]);

  const records = [
    facts.risks.length && `${facts.risks.length} risks`,
    facts.plant.length && `${facts.plant.length} plant items`,
    facts.chemicals.length && `${facts.chemicals.length} chemicals`,
    facts.subcontractors.length && `${facts.subcontractors.length} subcontractors`,
    facts.projects.length && `${facts.projects.length} projects`,
  ].filter(Boolean);

  return (
    <div className="forge-glow overflow-hidden rounded-2xl border border-ink bg-ink text-bg">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-widest text-bg/50">{no} · writing</p>
          <p className="truncate font-display text-lg font-extrabold tracking-tight">{title}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl font-extrabold tabular-nums text-accent">{words.toLocaleString("en-AU")}</p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-bg/50">words</p>
        </div>
      </div>

      <div className="forge-bar h-0.5 w-full bg-bg/10" aria-hidden="true" />

      <ol className="flex flex-wrap gap-1.5 px-5 py-3" aria-label="Progress">
        {STAGES.map((s, i) => {
          const state = i < stage ? "done" : i === stage ? "now" : "next";
          return (
            <li
              key={s.label}
              aria-current={state === "now" ? "step" : undefined}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors duration-500 ${
                state === "done"
                  ? "border-accent/40 bg-accent/15 text-accent"
                  : state === "now"
                    ? "border-accent bg-accent text-ink"
                    : "border-bg/15 text-bg/40"
              }`}
            >
              {state === "done" ? (
                <Icon name="check" className="h-3 w-3" />
              ) : state === "now" ? (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink" />
              ) : null}
              {i === 1 && records.length && state !== "next" ? `Pulling ${records.slice(0, 2).join(", ")}` : s.label}
            </li>
          );
        })}
      </ol>

      <div className="relative mx-3 mb-3 overflow-hidden rounded-xl bg-surface text-ink">
        <div ref={paper} className="iso-doc max-h-[58dvh] min-h-[16rem] overflow-y-auto p-5 sm:p-7" data-lenis-prevent>
          {text ? (
            <>
              <div dangerouslySetInnerHTML={{ __html: mdToHtml(text) }} />
              <span className="forge-caret" aria-hidden="true" />
            </>
          ) : (
            <p className="flex items-center gap-2 text-sm text-ink-soft">
              <span className="forge-caret" aria-hidden="true" /> Reading your business details
            </p>
          )}
        </div>
        <div className="forge-scan pointer-events-none absolute inset-x-0 top-0 h-24" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-surface to-transparent" aria-hidden="true" />
      </div>
    </div>
  );
}

/* ---------- a whole set ---------- */

export function ForgePanel({
  std,
  doneKeys,
  currentKey,
  partial,
  words,
  total,
  finished,
  stopped,
  builtIn,
  onStop,
  onDismiss,
}: {
  std: IsoStd;
  doneKeys: string[];
  currentKey: string | null;
  partial: string;
  words: number;
  total: number;
  finished: boolean;
  stopped: boolean;
  /** some of the documents were written by the built-in generator, not the AI */
  builtIn: boolean;
  onStop: () => void;
  onDismiss: () => void;
}) {
  const m = STANDARDS[std];
  const list = CATALOGUE[std];
  const done = doneKeys.length;
  const live = useCountUp(words + wordCount(partial), 350);
  const pct = total ? Math.round(((done + (currentKey && partial ? 0.5 : 0)) / total) * 100) : 0;
  const cur = list.find((d) => docKey(std, d.id) === currentKey);
  const lines = tail(partial);
  const done2 = useCountUp(done, 300);

  return (
    <section
      aria-label={`Writing the ${m.name} set`}
      className={`relative mb-6 overflow-hidden rounded-3xl bg-ink p-6 text-bg sm:p-8 ${finished ? "forge-finish" : "forge-glow"}`}
    >
      <div className="forge-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-accent">
              {finished ? "Set drafted" : stopped ? "Stopped" : "Writing your set"}
            </p>
            <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{m.name}</h2>
          </div>
          <div className="flex gap-6 text-right">
            <div>
              <p className="font-display text-4xl font-extrabold tabular-nums">
                {done2}
                <span className="text-xl text-bg/40">/{total}</span>
              </p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-bg/50">documents</p>
            </div>
            <div>
              <p className="font-display text-4xl font-extrabold tabular-nums text-accent">{live.toLocaleString("en-AU")}</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-bg/50">words</p>
            </div>
          </div>
        </div>

        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-bg/10" role="progressbar" aria-valuenow={finished ? 100 : pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="forge-fill h-full rounded-full bg-accent" style={{ width: `${finished ? 100 : pct}%` }} />
        </div>

        <ul className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(2.6rem,1fr))] gap-1.5" aria-label="Documents">
          {list.map((d) => {
            const key = docKey(std, d.id);
            const state = doneKeys.includes(key) ? "done" : key === currentKey ? "now" : "wait";
            return (
              <li
                key={d.id}
                title={`${docNumber(std, d.id)} ${d.title}`}
                className={`flex h-10 items-center justify-center rounded-lg border font-mono text-[11px] font-semibold ${
                  state === "done"
                    ? "forge-tile-done border-accent/50 bg-accent/20 text-accent"
                    : state === "now"
                      ? "forge-tile-now border-accent bg-accent text-ink"
                      : "border-bg/15 text-bg/35"
                }`}
              >
                {state === "done" ? <Icon name="check" className="h-4 w-4" /> : docNumber(std, d.id).split("-")[1]}
              </li>
            );
          })}
        </ul>

        <div className="mt-5 min-h-[7.5rem] rounded-xl border border-bg/10 bg-bg/5 p-4">
          {finished ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-bg/80">
                {total} documents written from your business and records. Read each one, edit what is not how you work,
                then approve it.
              </p>
              <button type="button" onClick={onDismiss} className="rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-ink hover:brightness-95">
                Review the documents
              </button>
            </div>
          ) : stopped ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-bg/80">Stopped. {done} documents were written and saved. You can carry on whenever you like.</p>
              <button type="button" onClick={onDismiss} className="rounded-full border border-bg/30 px-5 py-2.5 text-sm font-semibold hover:bg-bg/10">
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-semibold">
                  <span className="font-mono text-xs text-accent">{cur ? docNumber(std, cur.id) : ""}</span> {cur ? cur.title : "Starting"}
                  <span className="forge-caret forge-caret-light" aria-hidden="true" />
                </p>
                <button type="button" onClick={onStop} className="shrink-0 rounded-full border border-bg/30 px-3.5 py-1.5 text-xs font-semibold hover:bg-bg/10">
                  Stop
                </button>
              </div>
              <ul className="mt-3 space-y-0.5 font-mono text-[11px] leading-relaxed" aria-hidden="true">
                {lines.map((l, i) => (
                  <li key={`${i}-${l.slice(0, 12)}`} className="truncate" style={{ opacity: 0.25 + (i / Math.max(1, lines.length - 1)) * 0.65 }}>
                    {l}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        {finished && builtIn && (
          <p className="mt-3 text-center text-xs text-bg/50">
            Built-in drafts are written from your details. Connect an AI key for longer, fully tailored versions.{" "}
            <Link href="/dashboard/help/iso-vault" className="underline">How it works</Link>
          </p>
        )}
      </div>
    </section>
  );
}
