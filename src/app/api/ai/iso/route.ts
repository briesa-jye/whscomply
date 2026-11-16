import Anthropic from "@anthropic-ai/sdk";
import { client, fail, guard, MODEL } from "@/lib/ai-server";
import { findDoc } from "@/lib/iso/catalogue";
import { buildIsoPrompt, ISO_SYSTEM } from "@/lib/iso/generate";
import { isStd } from "@/lib/iso/standards";
import type { IsoFacts, IsoProfile } from "@/lib/iso/types";

export const maxDuration = 300;

const MAX_OUTPUT_TOKENS = 16000;

const s = (v: unknown, max = 600) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";
const list = <T>(v: unknown, max: number, f: (x: Record<string, unknown>) => T): T[] =>
  Array.isArray(v)
    ? v
        .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
        .slice(0, max)
        .map(f)
    : [];

function cleanProfile(v: unknown): IsoProfile {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const use = o.subcontractUse;
  return {
    company: s(o.company, 160),
    abn: s(o.abn, 20),
    address: s(o.address, 240),
    state: s(o.state, 40),
    scope: s(o.scope, 800),
    staff: s(o.staff, 12),
    sites: s(o.sites, 12),
    buildingTypes: Array.isArray(o.buildingTypes)
      ? o.buildingTypes.map((x) => s(x, 60)).filter(Boolean).slice(0, 10)
      : [],
    subcontractUse: use === "Minimal" || use === "Heavy" ? use : "Moderate",
    hazards: s(o.hazards, 1200),
    topManagement: s(o.topManagement, 120),
    topTitle: s(o.topTitle, 120),
    rep: s(o.rep, 120),
    existing: s(o.existing, 800),
    customers: s(o.customers, 400),
  };
}

function cleanFacts(v: unknown): IsoFacts {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  return {
    projects: list(o.projects, 20, (x) => ({ name: s(x.name, 120), stage: s(x.stage, 120), status: s(x.status, 30), client: s(x.client, 120) })),
    workers: Math.max(0, Math.min(100000, Math.round(Number(o.workers) || 0))),
    subcontractors: list(o.subcontractors, 40, (x) => ({ name: s(x.name, 120), trade: s(x.trade, 80), approved: x.approved === true })),
    highRiskSwms: Array.isArray(o.highRiskSwms) ? o.highRiskSwms.map((x) => s(x, 120)).filter(Boolean).slice(0, 30) : [],
    risks: list(o.risks, 30, (x) => ({ hazard: s(x.hazard, 160), category: s(x.category, 60), controls: s(x.controls, 300), rating: s(x.rating, 20) })),
    chemicals: list(o.chemicals, 30, (x) => ({ name: s(x.name, 100), hazard: s(x.hazard, 120), location: s(x.location, 120) })),
    plant: list(o.plant, 30, (x) => ({ name: s(x.name, 100), kind: s(x.kind, 60) })),
    incidents: list(o.incidents, 20, (x) => ({ title: s(x.title, 160), type: s(x.type, 40), severity: s(x.severity, 20), status: s(x.status, 30) })),
    ticketKinds: Array.isArray(o.ticketKinds) ? o.ticketKinds.map((x) => s(x, 120)).filter(Boolean).slice(0, 30) : [],
  };
}

export async function POST(req: Request) {
  const blocked = guard(req);
  if (blocked) return blocked;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return fail(400, "bad_request", "The request could not be read.");
  }
  if (!isStd(body.std)) return fail(400, "bad_request", "Unknown standard.");
  const spec = findDoc(body.std, s(body.doc, 80));
  if (!spec) return fail(400, "bad_request", "Unknown document.");

  const today = /^\d{4}-\d{2}-\d{2}$/.test(s(body.today, 12))
    ? s(body.today, 12)
    : new Date().toISOString().slice(0, 10);
  const prompt = buildIsoPrompt(spec, cleanProfile(body.profile), cleanFacts(body.facts), today);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const run = client().messages.stream(
          {
            model: MODEL,
            max_tokens: MAX_OUTPUT_TOKENS,
            system: ISO_SYSTEM,
            messages: [{ role: "user", content: prompt }],
          },
          { signal: req.signal },
        );
        run.on("text", (d) => controller.enqueue(encoder.encode(d)));
        await run.finalMessage();
      } catch (err) {
        if (!req.signal.aborted) {
          console.error(
            "iso error",
            err instanceof Anthropic.APIError ? `${err.status} ${err.message}` : err,
          );
          // A marker the browser looks for, so a cut-off document is never saved as finished.
          controller.enqueue(encoder.encode("\n\n[[GENERATION_FAILED]]"));
        }
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
