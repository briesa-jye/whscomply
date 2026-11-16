"use client";

import { generateLocal } from "./generate";
import type { IsoDocSpec, IsoFacts, IsoProfile, IsoStd } from "./types";

type Records = {
  projects: { name: string; stage: string; status: string; client: string }[];
  workers: { tickets: { kind: string }[] }[];
  subs: { name: string; trade: string; approved: boolean }[];
  swms: { title: string; highRisk: boolean; status: string }[];
  risks: { hazard: string; category: string; controls: string; likelihood: number; consequence: number; resL: number; resC: number }[];
  chemicals: { name: string; hazard?: string; location?: string }[];
  plant: { name: string; kind: string }[];
  incidents: { title: string; type: string; severity: string; status: string }[];
};

const level = (n: number) => (n >= 15 ? "Extreme" : n >= 10 ? "High" : n >= 5 ? "Medium" : "Low");

/** A compact snapshot of the business's own records for documents to draw on. */
export function buildFacts(r: Records): IsoFacts {
  return {
    projects: r.projects.slice(0, 20).map((p) => ({ name: p.name, stage: p.stage, status: p.status, client: p.client })),
    workers: r.workers.length,
    subcontractors: r.subs.slice(0, 40).map((s) => ({ name: s.name, trade: s.trade, approved: s.approved })),
    highRiskSwms: r.swms.filter((x) => x.highRisk && x.status === "Active").map((x) => x.title).slice(0, 30),
    risks: r.risks.slice(0, 30).map((x) => ({
      hazard: x.hazard,
      category: x.category,
      controls: x.controls,
      rating: level(x.resL * x.resC),
    })),
    chemicals: r.chemicals.slice(0, 30).map((c) => ({ name: c.name, hazard: c.hazard ?? "", location: c.location ?? "" })),
    plant: r.plant.slice(0, 30).map((p) => ({ name: p.name, kind: p.kind })),
    incidents: r.incidents.slice(0, 20).map((i) => ({ title: i.title, type: i.type, severity: i.severity, status: i.status })),
    ticketKinds: [...new Set(r.workers.flatMap((w) => w.tickets.map((t) => t.kind)))].slice(0, 30),
  };
}

export type GenResult = { text: string; source: "AI" | "Template" };

const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const t = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });

/**
 * Shows an already-built draft being written, a few characters at a time, so the built-in generator
 * looks and feels like the AI streaming. The text is the finished text; this only paces the reveal.
 */
export async function reveal(
  text: string,
  onProgress: ((partial: string) => void) | undefined,
  ms: number,
  signal?: AbortSignal,
) {
  if (!onProgress || reduced() || ms <= 0) return;
  const tick = 40;
  const steps = Math.max(8, Math.round(ms / tick));
  let shown = 0;
  for (let i = 1; i <= steps; i++) {
    // An ease-out curve: fast at first, settling as it nears the end, like a model slowing down to finish.
    const f = 1 - Math.pow(1 - i / steps, 1.6);
    let next = Math.floor(text.length * f);
    // Break on a space so words appear whole.
    const sp = text.indexOf(" ", next);
    next = sp === -1 || sp - next > 12 ? next : sp;
    if (next > shown) {
      shown = next;
      onProgress(text.slice(0, shown));
    }
    await sleep(tick, signal);
  }
  onProgress(text);
}

/**
 * Generates one document. With the AI connected it streams the document as it is written.
 * Without it (or if it fails) the built-in generator drafts from the same specification.
 */
export async function generateDoc(
  spec: IsoDocSpec,
  std: IsoStd,
  profile: IsoProfile,
  facts: IsoFacts,
  today: string,
  onProgress?: (partial: string) => void,
  signal?: AbortSignal,
  /** how long, in milliseconds, the built-in generator takes to write the document on screen */
  pace = 0,
): Promise<GenResult & { note?: string }> {
  const local = async (note?: string) => {
    const text = generateLocal(spec, profile, facts, today);
    await reveal(text, onProgress, pace, signal);
    return { text, source: "Template" as const, note };
  };
  try {
    const res = await fetch("/api/ai/iso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ std, doc: spec.id, profile, facts, today }),
      signal,
    });
    if (res.status === 503) return await local();
    if (!res.ok || !res.body)
      return await local("The AI could not write this one, so a built-in draft was used.");
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      text += dec.decode(value, { stream: true });
      onProgress?.(text.replace("[[GENERATION_FAILED]]", ""));
    }
    if (text.includes("[[GENERATION_FAILED]]") || text.trim().length < 400)
      return await local("The AI stopped part way, so a built-in draft was used.");
    return { text: text.trim() + "\n", source: "AI" };
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    return await local("The AI could not be reached, so a built-in draft was used.");
  }
}
