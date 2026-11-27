import { todayISO } from "./format";
import type { Plant, PlantCheck, PlantOnboarding, Subcontractor } from "./data";

/*
 * What each kind of plant has to supply before it comes onto a site.
 *
 * Registration rules follow SafeWork NSW (plant design registration and plant item
 * registration pages, Work Health and Safety Regulation). They are separate registrations:
 *  - design registration: concrete placing booms, tower cranes, mobile cranes over 10 t,
 *    boom-type EWPs, hoists that lift people more than 2.4 m (scissor lifts are exempt)
 *  - item registration: tower cranes, mobile cranes over 10 t, concrete placing booms
 * Road registration is separate again and applies to road-registered plant only.
 * CraneSafe and the 10 yearly major inspection are as Levi specified them.
 * Confirm this table against SafeWork before launch; it is meant to be edited.
 */

export type MeterKind = "hours" | "km" | "none";

export type PlantDocSpec = {
  key: string;
  label: string;
  /** true when the document has an expiry or next-due date */
  expiry: boolean;
  help?: string;
  /** only needed in some cases */
  when?: "over10t" | "peopleLifting";
};

export type PlantType = {
  key: string;
  label: string;
  cls: "Standard" | "Specialised";
  /** the meter its service and maintenance run on */
  meter: MeterKind;
  /** road registration: never, always, or the owner says whether it is road registered */
  road: "never" | "always" | "ask";
  /** asks for rated capacity in tonnes, because registration applies over 10 t */
  capacity?: boolean;
  asks?: ("electrical" | "peopleLifting")[];
  /** what the operator needs */
  licence: string;
  docs: PlantDocSpec[];
  /** checks made when it arrives on site, on top of the general ones */
  checks: string[];
};

const D = {
  designReg: { key: "designReg", label: "Design registration", expiry: false },
  itemReg: {
    key: "itemReg",
    label: "Item registration",
    expiry: true,
    help: "Item registration lasts one year. Enter the expiry date.",
  },
  roadReg: { key: "roadReg", label: "Road registration", expiry: true },
  craneSafe: {
    key: "craneSafe",
    label: "CraneSafe inspection report",
    expiry: true,
    help: "Enter the date the next inspection is due.",
  },
  major: {
    key: "major",
    label: "Major inspection report (10 yearly)",
    expiry: true,
    help: "Enter the date the next major inspection is due.",
  },
  liftReg: { key: "liftReg", label: "Lifting equipment register", expiry: false },
  loadChart: { key: "loadChart", label: "Load chart", expiry: false },
  foundation: {
    key: "foundation",
    label: "Foundation design statement (structural engineer)",
    expiry: false,
  },
  lineTest: {
    key: "lineTest",
    label: "Line thickness test report",
    expiry: true,
    help: "Enter the date the next test is due.",
  },
  hoistInsp: {
    key: "hoistInsp",
    label: "Hoist inspection certificate",
    expiry: true,
  },
  tag: { key: "tag", label: "Test and tag certificate", expiry: true },
} satisfies Record<string, PlantDocSpec>;

/** Every piece of plant needs these. */
const COMMON: PlantDocSpec[] = [
  { key: "manual", label: "Manufacturer's instructions", expiry: false },
  {
    key: "logbook",
    label: "Logbook evidence (recent entries)",
    expiry: false,
    help: "Photos or a scan of the latest logbook pages showing services and inspections.",
  },
  { key: "ra", label: "Plant risk assessment", expiry: false },
];

const GENERAL_CHECKS = [
  "Serial number or plant ID matches the documents",
  "Guards, covers and safety devices fitted and working",
  "Emergency stops, horn and reverse alarm work",
  "Lights, beacons and mirrors in good order",
  "No fluid leaks, cracks or damage",
  "Fire extinguisher fitted and in date, where required",
  "Tags and plates visible and current",
  "Operator present with the right licence",
];

const MOBILE_CHECKS = [
  "Seat belt and operator protective structure fitted",
  "Attachments and quick hitch locked and pinned",
];

const HRW = "High risk work licence for this plant";
const COMP = "Verified competency or ticket for this plant";

export const PLANT_TYPES: PlantType[] = [
  // ---- standardised plant
  {
    key: "forklift",
    label: "Forklift",
    cls: "Standard",
    meter: "hours",
    road: "ask",
    licence: HRW,
    docs: [],
    checks: [
      ...MOBILE_CHECKS,
      "Forks, chains and mast in good condition",
      "Load rating plate fitted and legible",
    ],
  },
  {
    key: "telehandler",
    label: "Telehandler",
    cls: "Standard",
    meter: "hours",
    road: "ask",
    licence: HRW,
    docs: [],
    checks: [...MOBILE_CHECKS, "Load chart in the cab and legible"],
  },
  {
    key: "excavator",
    label: "Excavator",
    cls: "Standard",
    meter: "hours",
    road: "ask",
    licence: COMP,
    docs: [],
    checks: [...MOBILE_CHECKS, "Bucket and hose guards fitted"],
  },
  {
    key: "piling-rig",
    label: "Piling rig",
    cls: "Standard",
    meter: "hours",
    road: "ask",
    licence: COMP,
    docs: [],
    checks: [...MOBILE_CHECKS, "Mast, leaders and rotary head in good condition"],
  },
  {
    key: "skid-steer",
    label: "Skid steer or bobcat",
    cls: "Standard",
    meter: "hours",
    road: "never",
    licence: COMP,
    docs: [],
    checks: [...MOBILE_CHECKS, "Lift arm support device available"],
  },
  {
    key: "loader",
    label: "Loader",
    cls: "Standard",
    meter: "hours",
    road: "ask",
    licence: COMP,
    docs: [],
    checks: MOBILE_CHECKS,
  },
  {
    key: "boom-ewp",
    label: "Boom-type EWP",
    cls: "Standard",
    meter: "hours",
    road: "never",
    licence: HRW,
    docs: [D.designReg],
    checks: [
      "Emergency lowering works from ground and platform",
      "Harness anchor points fitted",
      "Platform gate and guardrails secure",
    ],
  },
  {
    key: "scissor-lift",
    label: "Scissor lift",
    cls: "Standard",
    meter: "hours",
    road: "never",
    licence: COMP,
    docs: [],
    checks: [
      "Emergency lowering works from ground and platform",
      "Platform gate and guardrails secure",
    ],
  },
  {
    key: "electrical",
    label: "Electrical equipment and leads",
    cls: "Standard",
    meter: "none",
    road: "never",
    licence: COMP,
    docs: [D.tag],
    checks: ["Leads and plugs undamaged", "RCD protection used"],
  },
  {
    key: "other",
    label: "Other plant",
    cls: "Standard",
    meter: "hours",
    road: "ask",
    asks: ["electrical"],
    licence: COMP,
    docs: [],
    checks: [],
  },
  // ---- specialised plant
  {
    key: "mobile-crane",
    label: "Mobile crane",
    cls: "Specialised",
    meter: "hours",
    road: "always",
    capacity: true,
    licence: HRW,
    docs: [
      { ...D.designReg, when: "over10t" },
      { ...D.itemReg, when: "over10t" },
      D.craneSafe,
      D.major,
      D.liftReg,
      D.loadChart,
    ],
    checks: [
      "Outriggers, pads and stabilisers checked",
      "Limit switches and overload protection tested",
      "Wire rope, hooks and latches in good condition",
      "Load chart displayed and legible",
    ],
  },
  {
    key: "tower-crane",
    label: "Tower crane",
    cls: "Specialised",
    meter: "hours",
    road: "never",
    licence: HRW,
    docs: [
      D.designReg,
      D.itemReg,
      D.foundation,
      D.craneSafe,
      D.major,
      D.liftReg,
      D.loadChart,
    ],
    checks: [
      "Foundation matches the design statement",
      "Limit switches and overload protection tested",
      "Anemometer and aviation lights fitted",
      "Wire rope, hooks and latches in good condition",
    ],
  },
  {
    key: "concrete-boom-portable",
    label: "Portable concrete boom",
    cls: "Specialised",
    meter: "hours",
    road: "always",
    licence: COMP,
    docs: [D.designReg, D.itemReg, D.lineTest],
    checks: [
      "Boom and delivery line free of cracks and wear",
      "Outriggers extended and pads in place",
      "Hopper guard fitted",
    ],
  },
  {
    key: "concrete-boom-tower",
    label: "Tower concrete boom",
    cls: "Specialised",
    meter: "hours",
    road: "never",
    licence: COMP,
    docs: [D.designReg, D.itemReg, D.lineTest, D.foundation],
    checks: [
      "Foundation matches the design statement",
      "Boom and delivery line free of cracks and wear",
    ],
  },
  {
    key: "hoist",
    label: "Hoist",
    cls: "Specialised",
    meter: "none",
    road: "never",
    asks: ["peopleLifting"],
    licence: HRW,
    docs: [{ ...D.designReg, when: "peopleLifting" }, D.hoistInsp],
    checks: [
      "Gates and interlocks work",
      "Emergency lowering works",
      "Landing gates secure at every level",
    ],
  },
];

const OTHER = PLANT_TYPES.find((t) => t.key === "other")!;

export const plantTypeByKey = (key?: string) =>
  PLANT_TYPES.find((t) => t.key === key);

/** The type of a plant record, including older records that only have a label. */
export const plantTypeOf = (p: Pick<Plant, "typeKey" | "kind">): PlantType =>
  plantTypeByKey(p.typeKey) ??
  PLANT_TYPES.find((t) => t.label.toLowerCase() === p.kind.toLowerCase()) ??
  OTHER;

export type PlantFlags = {
  roadRegistered: boolean;
  electrical: boolean;
  peopleLifting: boolean;
};

/** The documents this plant has to supply, given its type and answers. */
export function plantDocSpecs(
  typeKey: string,
  flags: PlantFlags,
  capacityT: number | null,
): PlantDocSpec[] {
  const t = plantTypeByKey(typeKey) ?? OTHER;
  const out = [...COMMON];
  for (const d of t.docs) {
    if (d.when === "over10t" && !(capacityT !== null && capacityT > 10)) continue;
    if (d.when === "peopleLifting" && !flags.peopleLifting) continue;
    out.push(d);
  }
  if (t.road === "always" || (t.road === "ask" && flags.roadRegistered))
    out.push(D.roadReg);
  if (flags.electrical && !out.some((d) => d.key === "tag")) out.push(D.tag);
  return out;
}

/** The arrival inspection for a type of plant. */
export const newPlantChecks = (typeKey?: string): PlantCheck[] =>
  [...GENERAL_CHECKS, ...(plantTypeByKey(typeKey)?.checks ?? [])].map(
    (text, i): PlantCheck => ({
      id: `c${i + 1}`,
      text,
      result: null,
      note: "",
    }),
  );

export const OPERATOR_LABEL = {
  own: "Our own employees",
  "labour-hire": "Labour hire operators",
  mixed: "A mix of employees and labour hire",
} as const;

const daysUntil = (iso: string) =>
  Math.round(
    (Date.parse(`${iso}T00:00:00`) - Date.parse(`${todayISO()}T00:00:00`)) /
      86400000,
  );

/** Public liability sits with the contractor, not the plant. */
export function contractorPl(
  sub?: Pick<Subcontractor, "docs">,
): "n/a" | "ok" | "missing" | "expired" {
  if (!sub) return "n/a";
  const d = sub.docs.find((x) => /public liability/i.test(x.kind));
  if (!d) return "missing";
  if (d.expires && daysUntil(d.expires) < 0) return "expired";
  return "ok";
}

/** What still stops plant being approved. Empty means it can be approved. */
export function plantBlockers(
  o: PlantOnboarding,
  ctx: { photo: boolean; pl: ReturnType<typeof contractorPl> },
): string[] {
  const out: string[] = [];
  if (!ctx.photo) out.push("No photo of the plant");
  if (ctx.pl === "missing")
    out.push("The contractor has no public liability insurance on file");
  if (ctx.pl === "expired")
    out.push("The contractor's public liability insurance has expired");
  if (o.docs.some((d) => !d.files?.length))
    out.push("A document has no file attached");
  if (o.docs.some((d) => !d.verified)) out.push("Documents not all verified");
  if (o.docs.some((d) => d.expires && daysUntil(d.expires) < 0))
    out.push("A document has expired");
  if (o.inspection.some((c) => c.result === null))
    out.push("Arrival inspection not finished");
  if (o.inspection.some((c) => c.result === "fail"))
    out.push("Arrival inspection has a failed item");
  return out;
}

/** How far a meter-based service or maintenance has to run. Negative means overdue. */
export function readingLeft(
  p: Pick<Plant, "meter" | "serviceReading" | "maintenance">,
  which: "service" | "maintenance",
): { left: number; unit: "h" | "km" } | null {
  if (!p.meter) return null;
  const next =
    which === "service" ? p.serviceReading?.next : p.maintenance?.nextReading;
  if (next === undefined || next === null) return null;
  return { left: next - p.meter.reading, unit: p.meter.kind === "km" ? "km" : "h" };
}

export const readingTone = (left: number, unit: "h" | "km") =>
  left <= (unit === "km" ? 500 : 25) ? ("owed" as const) : ("ok" as const);
