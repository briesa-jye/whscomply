import { commonDocs } from "./common";
import { DOCS_14001 } from "./docs14001";
import { DOCS_45001 } from "./docs45001";
import { DOCS_9001 } from "./docs9001";
import { STANDARDS } from "./standards";
import type { IsoDocSpec, IsoStd } from "./types";

/** Order within a set: the policy side first, then what the business does, then checking and improving. */
const ORDER_FIRST = ["scope", "context", "policy", "roles"];
const ORDER_LAST = [
  "monitoring-analysis",
  "monitoring-performance",
  "monitoring-environment",
  "compliance-evaluation",
  "internal-audit",
  "audit-checklist",
  "mgmt-review",
  "nc-ca",
  "improvement",
];

const build = (std: IsoStd): IsoDocSpec[] => {
  const common = commonDocs(std);
  const own = { "9001": DOCS_9001, "45001": DOCS_45001, "14001": DOCS_14001 }[std];
  const all = [...common, ...own];
  // A document defined for the standard replaces a common one with the same id.
  const byId = new Map<string, IsoDocSpec>();
  for (const x of all) byId.set(x.id, x);
  const list = [...byId.values()];
  const rank = (x: IsoDocSpec) => {
    const a = ORDER_FIRST.indexOf(x.id);
    if (a >= 0) return a;
    const b = ORDER_LAST.indexOf(x.id);
    return b >= 0 ? 1000 + b : 100;
  };
  return list
    .map((x, i) => ({ x, i }))
    .sort((p, q) => rank(p.x) - rank(q.x) || p.i - q.i)
    .map(({ x }) => x);
};

export const CATALOGUE: Record<IsoStd, IsoDocSpec[]> = {
  "9001": build("9001"),
  "45001": build("45001"),
  "14001": build("14001"),
};

export const docNumber = (std: IsoStd, id: string) => {
  const i = CATALOGUE[std].findIndex((x) => x.id === id);
  return `${STANDARDS[std].prefix}-${String(i + 1).padStart(2, "0")}`;
};

export const findDoc = (std: IsoStd, id: string) =>
  CATALOGUE[std].find((x) => x.id === id);

/** Documents in the set that share a clause with this one, to list as related. */
export function related(spec: IsoDocSpec, max = 6): IsoDocSpec[] {
  const own = new Set(spec.clauses.map((c) => c.split(".").slice(0, 2).join(".")));
  return CATALOGUE[spec.std]
    .filter(
      (x) =>
        x.id !== spec.id &&
        x.clauses.some((c) => own.has(c.split(".").slice(0, 2).join("."))),
    )
    .slice(0, max);
}

/** Which documents answer each clause of the standard, for the coverage table. */
export function coverage(std: IsoStd) {
  return STANDARDS[std].clauses.map((cl) => ({
    ...cl,
    docs: CATALOGUE[std].filter((d) =>
      d.clauses.some((c) => c === cl.clause || c.startsWith(`${cl.clause}.`)),
    ),
  }));
}
