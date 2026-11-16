"use client";

import { useMemo } from "react";
import { expiryOf } from "@/lib/data";
import { useStore } from "@/components/app/DemoStore";

/**
 * Everything the subcontractor portal shows, narrowed to one subcontractor:
 * only the projects they were invited to, their own crew and the records that touch them.
 */
export function usePortal() {
  const store = useStore();
  const { subs, projects, workers, swms, actions, notices, incidents, invites } =
    store;
  const subId = store.settings.subId ?? "s-apex";
  const sub = subs.find((x) => x.id === subId);
  const warn = store.settings.warnDays;

  return useMemo(() => {
    const myProjects = projects.filter((p) => sub?.projects.includes(p.id));
    const ids = new Set(myProjects.map((p) => p.id));
    const crew = workers.filter((w) => w.company === subId);
    const crewIds = new Set(crew.map((w) => w.id));
    const names = new Set(
      [sub?.contact, sub?.name, ...crew.map((w) => w.name)].filter(
        (x): x is string => !!x,
      ),
    );
    const myInvites = invites.filter((i) => i.subId === subId);
    const pending = myInvites.filter((i) => i.status === "Pending");
    const mySwms = swms.filter(
      (x) =>
        ids.has(x.projectId) &&
        x.status === "Active" &&
        x.required.some((w) => crewIds.has(w)),
    );
    /** crew still to sign: [swms, worker] pairs */
    const unsigned = mySwms.flatMap((x) =>
      x.required
        .filter((w) => crewIds.has(w) && !x.signed.includes(w))
        .map((w) => ({ swms: x, worker: crew.find((c) => c.id === w)! })),
    );
    const myActions = actions.filter(
      (a) => ids.has(a.projectId) && names.has(a.owner),
    );
    const myNotices = notices
      .filter((n) => n.projectId === "all" || ids.has(n.projectId))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned));
    const myIncidents = incidents.filter(
      (i) => ids.has(i.projectId) && names.has(i.reporter),
    );
    const docs = sub?.docs ?? [];
    const docsDue = docs.filter((d) => {
      const e = expiryOf(d.expires, warn);
      return e === "soon" || e === "expired";
    });
    const ticketsDue = crew.flatMap((w) =>
      w.tickets
        .filter((t) => {
          const e = expiryOf(t.expires, warn);
          return e === "soon" || e === "expired";
        })
        .map((t) => ({ worker: w, ticket: t })),
    );
    /** crew assigned to a project who have not done its induction */
    const uninducted = crew.flatMap((w) =>
      w.projects
        .filter((p) => ids.has(p) && !w.inducted.includes(p))
        .map((p) => ({ worker: w, project: projects.find((x) => x.id === p)! })),
    );
    return {
      ...store,
      subId,
      sub,
      myProjects,
      projectIds: ids,
      crew,
      pending,
      myInvites,
      mySwms,
      unsigned,
      myActions,
      openActions: myActions.filter((a) => a.status === "Open"),
      myNotices,
      myIncidents,
      docs,
      docsDue,
      ticketsDue,
      uninducted,
      warn,
    };
  }, [
    store,
    subId,
    sub,
    projects,
    workers,
    swms,
    actions,
    notices,
    incidents,
    invites,
    warn,
  ]);
}
