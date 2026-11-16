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
): Promise<GenResult & { note?: string }> {
  const local = (note?: string) => ({
    text: generateLocal(spec, profile, facts, today),
    source: "Template" as const,
    note,
  });
  try {
    const res = await fetch("/api/ai/iso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ std, doc: spec.id, profile, facts, today }),
      signal,
    });
    if (res.status === 503) return local();
    if (!res.ok || !res.body)
      return local("The AI could not write this one, so a built-in draft was used.");
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
      return local("The AI stopped part way, so a built-in draft was used.");
    return { text: text.trim() + "\n", source: "AI" };
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    return local("The AI could not be reached, so a built-in draft was used.");
  }
}
