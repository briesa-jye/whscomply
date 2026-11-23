"use client";

import { useMemo } from "react";
import { attentionFor, type Attention } from "@/lib/attention";
import { useScope } from "./DemoStore";

/** What needs action across the current project selection. Empty until the browser has loaded. */
export function useAttention(): Attention[] {
  const s = useScope();
  return useMemo(() => {
    if (!s.ready) return [];
    const names = new Map(s.projects.map((p) => [p.id, p.name]));
    const people = new Map(s.workers.map((w) => [w.id, w.name]));
    return attentionFor({
      workers: s.workersIn,
      subs: s.subsIn,
      swms: s.swmsIn,
      invites: s.all
        ? s.invites
        : s.invites.filter((i) => i.projectId === s.scopeId),
      actions: s.actionsIn,
      risks: s.risksIn,
      incidents: s.incidentsIn,
      talks: s.talksIn,
      permits: s.permitsIn,
      plant: s.plantIn,
      chemicals: s.chemicalsIn,
      drills: s.drillsIn,
      docs: s.docsIn,
      visitors: s.visitorsIn,
      defects: s.defectsIn,
      rfis: s.rfisIn,
      schedules: s.schedulesIn,
      inspections: s.inspections,
      requests: s.all
        ? s.siteRequests
        : s.siteRequests.filter((r) => r.projectId === s.scopeId),
      warnDays: s.settings.warnDays,
      notify: s.settings.notify,
      projectName: (id) => names.get(id) ?? "Project",
      workerName: (id) => people.get(id) ?? "A worker",
    });
  }, [s]);
}
