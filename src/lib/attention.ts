import { todayISO } from "./format";
import { plantLaterDocs, readingLeft, readingTone } from "./plant-types";
import {
  daysUntil,
  expiryOf,
  meetingDue,
  meetingHref,
  meetingStatus,
  plantApproval,
  type Action,
  type Chemical,
  type Defect,
  type Inspection,
  type InspectionSchedule,
  type Rfi,
  type SiteOnboarding,
  type SiteRequest,
  type Doc,
  type Drill,
  type Permit,
  type Plant,
  type Visitor,
  type Incident,
  type Invite,
  type Risk,
  type Subcontractor,
  type Swms,
  type Talk,
  type Worker,
} from "./data";

export type Attention = {
  id: string;
  kind:
    | "ticket"
    | "insurance"
    | "swms"
    | "action"
    | "risk"
    | "incident"
    | "talk"
    | "permit"
    | "plant"
    | "chemical"
    | "drill"
    | "doc"
    | "visitor"
    | "defect"
    | "rfi"
    | "inspection"
    | "invite"
    | "request";
  title: string;
  where: string;
  due: string;
  href: string;
  tone: "owed" | "neutral";
  /** lower sorts first */
  rank: number;
  who: string;
  projectId?: string;
};

const dueText = (d: number) =>
  d < 0
    ? `Overdue ${-d} day${d === -1 ? "" : "s"}`
    : d === 0
      ? "Due today"
      : `In ${d} day${d === 1 ? "" : "s"}`;

type Input = {
  workers: Worker[];
  subs: Subcontractor[];
  swms: Swms[];
  invites: Invite[];
  actions: Action[];
  risks: Risk[];
  incidents: Incident[];
  talks: Talk[];
  permits: Permit[];
  plant: Plant[];
  chemicals: Chemical[];
  drills: Drill[];
  docs: Doc[];
  visitors: Visitor[];
  defects: Defect[];
  rfis: Rfi[];
  schedules: InspectionSchedule[];
  inspections: Inspection[];
  requests: SiteRequest[];
  onboardings: SiteOnboarding[];
  warnDays: number;
  notify: {
    tickets: boolean;
    insurances: boolean;
    actions: boolean;
    incidents: boolean;
  };
  projectName: (id: string) => string;
  workerName: (id: string) => string;
  subName: (id: string) => string;
};

const ini = (n: string) =>
  n
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

export function attentionFor(i: Input): Attention[] {
  const out: Attention[] = [];

  if (i.notify.tickets)
    for (const w of i.workers)
      for (const t of w.tickets) {
        const e = expiryOf(t.expires, i.warnDays);
        if (e !== "soon" && e !== "expired") continue;
        const d = daysUntil(t.expires as string);
        out.push({
          id: `t-${t.id}`,
          kind: "ticket",
          title: `${w.name}, ${t.kind}`,
          where:
            e === "expired" ? "Expired. Flag at sign-on" : "Ticket expiring",
          due: e === "expired" ? `Expired ${-d} days ago` : `In ${d} days`,
          href: "/dashboard/people",
          tone: "owed",
          rank: d,
          who: ini(w.name),
        });
      }

  if (i.notify.insurances)
    for (const s of i.subs)
      for (const d of s.docs) {
        const e = expiryOf(d.expires, i.warnDays);
        if (e !== "soon" && e !== "expired") continue;
        const n = daysUntil(d.expires as string);
        out.push({
          id: `d-${d.id}`,
          kind: "insurance",
          title: `${s.name}, ${d.kind}`,
          where:
            e === "expired"
              ? "Expired. Subcontractor on site"
              : "Document expiring",
          due: e === "expired" ? `Expired ${-n} days ago` : `In ${n} days`,
          href: "/dashboard/subcontractors",
          tone: "owed",
          rank: n,
          who: ini(s.name),
        });
      }

  for (const s of i.swms) {
    if (s.status !== "Active") continue;
    const owed = s.required.filter((w) => !s.signed.includes(w)).length;
    if (!owed) continue;
    out.push({
      id: `sw-${s.id}`,
      kind: "swms",
      title: `${s.title}: ${owed} unsigned`,
      where: i.projectName(s.projectId),
      due: "Before work starts",
      href: `/dashboard/swms/${s.id}`,
      tone: "owed",
      rank: -1,
      who: ini(s.owner),
      projectId: s.projectId,
    });
  }

  if (i.notify.actions)
    for (const a of i.actions) {
      if (a.status !== "Open") continue;
      const d = daysUntil(a.due);
      if (d > 7) continue;
      out.push({
        id: `a-${a.id}`,
        kind: "action",
        title: a.title,
        where: `${a.source}: ${a.sourceLabel}`,
        due: dueText(d),
        href: "/dashboard/actions",
        tone: d <= 0 ? "owed" : "neutral",
        rank: d,
        who: ini(a.owner),
        projectId: a.projectId,
      });
    }

  for (const r of i.risks) {
    if (r.status === "Closed") continue;
    const d = daysUntil(r.review);
    if (d > 7) continue;
    out.push({
      id: `r-${r.id}`,
      kind: "risk",
      title: `Review risk: ${r.hazard}`,
      where: i.projectName(r.projectId),
      due: dueText(d),
      href: "/dashboard/risks",
      tone: d <= 0 ? "owed" : "neutral",
      rank: d,
      who: ini(r.owner),
      projectId: r.projectId,
    });
  }

  if (i.notify.incidents)
    for (const n of i.incidents) {
      if (n.status === "Closed") continue;
      out.push({
        id: `i-${n.id}`,
        kind: "incident",
        title: n.title,
        where: `${n.type} · ${n.status}`,
        due: n.notifiable === null ? "Assess notifiability" : n.status,
        href: `/dashboard/incidents/${n.id}`,
        tone:
          n.notifiable === null || n.severity === "High" ? "owed" : "neutral",
        rank: 0,
        who: ini(n.reporter),
        projectId: n.projectId,
      });
    }

  const clock = new Date();
  const hm = `${String(clock.getHours()).padStart(2, "0")}:${String(clock.getMinutes()).padStart(2, "0")}`;
  for (const t of i.talks) {
    const st = meetingStatus(t);
    if (st === "Completed") continue;
    const d = daysUntil(t.date);
    const due = meetingDue(t, todayISO(), hm);
    if (st === "Scheduled" && !due && d > 7) continue;
    const kind = t.kind ?? "Toolbox talk";
    out.push({
      id: `tb-${t.id}`,
      kind: "talk",
      title:
        st === "In progress"
          ? `Finish ${kind.toLowerCase()}: ${t.topic}`
          : `${kind}: ${t.topic}`,
      where: i.projectName(t.projectId),
      due:
        st === "In progress"
          ? "In progress, waiting to be completed"
          : due
            ? d < 0
              ? dueText(d)
              : "Due now, start it"
            : d === 0
              ? `Today ${t.time ?? ""}`.trim()
              : dueText(d),
      href: meetingHref(t),
      tone: due ? "owed" : "neutral",
      // a briefing that is due, or running, comes before older overdue items
      rank: due ? -1000 + Math.min(d, 0) : st === "In progress" ? -500 : d + 2,
      who: ini(t.presenter),
      projectId: t.projectId,
    });
  }

  for (const p of i.permits) {
    if (p.status === "Approved" && daysUntil(p.until) < 0)
      out.push({
        id: `pm-${p.id}`,
        kind: "permit",
        title: `Permit still open: ${p.title}`,
        where: `${p.kind} · ${i.projectName(p.projectId)}`,
        due: `Expired ${-daysUntil(p.until)} day${daysUntil(p.until) === -1 ? "" : "s"} ago`,
        href: "/dashboard/permits",
        tone: "owed",
        rank: daysUntil(p.until),
        who: ini(p.issuedTo),
        projectId: p.projectId,
      });
    else if (p.status === "Requested")
      out.push({
        id: `pm-${p.id}`,
        kind: "permit",
        title: `Permit awaiting approval: ${p.title}`,
        where: `${p.kind} · ${i.projectName(p.projectId)}`,
        due: dueText(daysUntil(p.from)),
        href: "/dashboard/permits",
        tone: "neutral",
        rank: daysUntil(p.from),
        who: ini(p.requestedBy),
        projectId: p.projectId,
      });
  }

  for (const p of i.plant) {
    const approval = plantApproval(p);
    if (approval === "Submitted") {
      out.push({
        id: `pl-${p.id}-onb`,
        kind: "plant",
        title: `Plant waiting for approval: ${p.name}`,
        where: `${p.owner} · ${i.projectName(p.projectId)}`,
        due: "Waiting for review",
        href: `/dashboard/plant/onboarding/${p.id}`,
        tone: "owed",
        // plant cannot start work until this is decided, so it leads the list
        rank: -800,
        who: ini(p.owner),
        projectId: p.projectId,
      });
      continue;
    }
    if (approval !== "Approved") continue;
    if (p.status === "Out of service")
      out.push({
        id: `pl-${p.id}-oos`,
        kind: "plant",
        title: `${p.name} is out of service`,
        where: p.defect || i.projectName(p.projectId),
        due: "Defect open",
        href: "/dashboard/plant",
        tone: "owed",
        rank: -2,
        who: ini(p.name),
        projectId: p.projectId,
      });
    if (p.status === "Off site") continue;
    const svc = daysUntil(p.nextService);
    if (svc <= 7)
      out.push({
        id: `pl-${p.id}-svc`,
        kind: "plant",
        title: `Service due: ${p.name}`,
        where: i.projectName(p.projectId),
        due: dueText(svc),
        href: "/dashboard/plant",
        tone: svc < 0 ? "owed" : "neutral",
        rank: svc,
        who: ini(p.name),
        projectId: p.projectId,
      });
    if (p.tagDue) {
      const tag = daysUntil(p.tagDue);
      if (tag <= 7)
        out.push({
          id: `pl-${p.id}-tag`,
          kind: "plant",
          title: `Test and tag due: ${p.name}`,
          where: i.projectName(p.projectId),
          due: dueText(tag),
          href: "/dashboard/plant",
          tone: tag < 0 ? "owed" : "neutral",
          rank: tag,
          who: ini(p.name),
          projectId: p.projectId,
        });
    }
  }

  for (const c of i.chemicals) {
    if (c.status !== "In use") continue;
    if (!c.hasSds)
      out.push({
        id: `ch-${c.id}`,
        kind: "chemical",
        title: `No safety data sheet: ${c.name}`,
        where: i.projectName(c.projectId),
        due: "Obtain from supplier",
        href: "/dashboard/chemicals",
        tone: "owed",
        rank: -1,
        who: ini(c.supplier),
        projectId: c.projectId,
      });
    else if (c.sdsDate && daysUntil(c.sdsDate) < -1825)
      out.push({
        id: `ch-${c.id}`,
        kind: "chemical",
        title: `Safety data sheet over 5 years old: ${c.name}`,
        where: i.projectName(c.projectId),
        due: "Request a current SDS",
        href: "/dashboard/chemicals",
        tone: "owed",
        rank: -1,
        who: ini(c.supplier),
        projectId: c.projectId,
      });
  }

  for (const d of i.drills) {
    const later = i.drills.some(
      (x) =>
        x.projectId === d.projectId && x.kind === d.kind && x.date > d.date,
    );
    if (later) continue;
    const n = daysUntil(d.nextDue);
    if (n > 14) continue;
    out.push({
      id: `dr-${d.id}`,
      kind: "drill",
      title: `${d.kind} due`,
      where: i.projectName(d.projectId),
      due: dueText(n),
      href: "/dashboard/emergency",
      tone: n < 0 ? "owed" : "neutral",
      rank: n,
      who: ini(d.by),
      projectId: d.projectId,
    });
  }

  for (const d of i.docs) {
    const n = daysUntil(d.reviewDue);
    if (n > 14) continue;
    out.push({
      id: `dc-${d.id}`,
      kind: "doc",
      title: `Review due: ${d.title}`,
      where:
        d.projectId === "all" ? "Whole business" : i.projectName(d.projectId),
      due: dueText(n),
      href: "/dashboard/documents",
      tone: n < 0 ? "owed" : "neutral",
      rank: n,
      who: ini(d.owner),
      projectId: d.projectId,
    });
  }

  // service by meter reading, and maintenance by date or reading
  for (const p of i.plant) {
    if (plantApproval(p) !== "Approved" || p.status === "Off site") continue;
    // commissioning paperwork has been uploaded and is waiting to be checked
    if (plantLaterDocs(p).some((d) => d.files?.length && !d.verified))
      out.push({
        id: `pl-${p.id}-comm`,
        kind: "plant",
        title: `Commissioning paperwork to verify: ${p.name}`,
        where: i.projectName(p.projectId),
        due: "Cannot be used until verified",
        href: `/dashboard/plant/${p.id}`,
        tone: "owed",
        rank: -700,
        who: ini(p.name),
        projectId: p.projectId,
      });
    for (const which of ["service", "maintenance"] as const) {
      const left = readingLeft(p, which);
      const days =
        which === "maintenance" && p.maintenance
          ? daysUntil(p.maintenance.next)
          : null;
      const byReading = !!left && readingTone(left.left, left.unit) === "owed";
      const byDate = days !== null && days <= 7;
      if (!byReading && !byDate) continue;
      const overdue = (byReading && left!.left < 0) || (days !== null && days < 0);
      out.push({
        id: `pl-${p.id}-${which}-m`,
        kind: "plant",
        title: `${which === "service" ? "Service" : "Maintenance"} due: ${p.name}`,
        where: i.projectName(p.projectId),
        due:
          byReading && left
            ? left.left < 0
              ? `Overdue by ${-left.left} ${left.unit}`
              : `In ${left.left} ${left.unit}`
            : dueText(days as number),
        href: `/dashboard/plant/${p.id}/care?kind=${which}`,
        tone: overdue ? "owed" : "neutral",
        rank: byReading && left ? left.left : (days as number),
        who: ini(p.name),
        projectId: p.projectId,
      });
    }
  }

  for (const o of i.onboardings) {
    if (o.status !== "Submitted") continue;
    out.push({
      id: `so-${o.id}`,
      kind: "chemical",
      title: `Site onboarding to review: ${i.subName(o.subId)}`,
      where: i.projectName(o.projectId),
      due: "SWMS and SDS waiting for approval",
      href: `/dashboard/chemicals/onboarding/${o.id}`,
      tone: "owed",
      // its workers cannot start until this is decided, so it leads the list
      rank: -800,
      who: ini(i.subName(o.subId)),
      projectId: o.projectId,
    });
  }

  for (const r of i.requests) {
    if (r.status !== "Pending") continue;
    out.push({
      id: `sr-${r.id}`,
      kind: "request",
      title: `Site access request: ${i.workerName(r.workerId)}`,
      where: i.projectName(r.projectId),
      due: "Waiting for approval",
      href: `/dashboard/projects/${r.projectId}`,
      tone: "owed",
      rank: 0,
      who: ini(i.workerName(r.workerId)),
      projectId: r.projectId,
    });
  }

  for (const v of i.visitors) {
    if (v.outAt || v.inAt.slice(0, 10) >= todayISO()) continue;
    out.push({
      id: `v-${v.id}`,
      kind: "visitor",
      title: `Visitor never signed out: ${v.name}`,
      where: i.projectName(v.projectId),
      due: "Signed in on an earlier day",
      href: `/dashboard/projects/${v.projectId}`,
      tone: "owed",
      rank: -1,
      who: ini(v.name),
      projectId: v.projectId,
    });
  }

  for (const d of i.defects) {
    if (d.status === "Closed") continue;
    const n = daysUntil(d.due);
    if (d.priority !== "Critical" && n > 3) continue;
    out.push({
      id: `df-${d.id}`,
      kind: "defect",
      title: `${d.priority === "Critical" ? "Critical defect" : "Defect"}: ${d.title}`,
      where: `${d.location} · ${d.assignee}`,
      due: dueText(n),
      href: "/dashboard/defects",
      tone: d.priority === "Critical" || n < 0 ? "owed" : "neutral",
      rank: d.priority === "Critical" ? -3 : n,
      who: ini(d.assignee || "Defect"),
      projectId: d.projectId,
    });
  }

  for (const r of i.rfis) {
    if (r.status !== "Open") continue;
    const n = daysUntil(r.due);
    if (n > 2) continue;
    out.push({
      id: `rf-${r.id}`,
      kind: "rfi",
      title: `${r.number} unanswered: ${r.subject}`,
      where: `To ${r.to} · ${i.projectName(r.projectId)}`,
      due: dueText(n),
      href: "/dashboard/rfis",
      tone: n < 0 ? "owed" : "neutral",
      rank: n,
      who: ini(r.raisedBy),
      projectId: r.projectId,
    });
  }

  for (const sc of i.schedules) {
    const last = i.inspections
      .filter((x) => x.projectId === sc.projectId && x.kind === sc.kind)
      .map((x) => x.date)
      .sort()
      .pop();
    const n = last ? daysUntil(last) + sc.everyDays : 0;
    if (n > 0) continue;
    out.push({
      id: `sc-${sc.id}`,
      kind: "inspection",
      title: `${sc.kind} due`,
      where: i.projectName(sc.projectId),
      due: n === 0 ? "Due today" : `Overdue ${-n} day${n === -1 ? "" : "s"}`,
      href: "/dashboard/inspections",
      tone: "owed",
      rank: n - 1,
      who: ini(sc.kind),
      projectId: sc.projectId,
    });
  }

  for (const v of i.invites) {
    const sub = i.subs.find((x) => x.id === v.subId)?.name ?? "A subcontractor";
    const age = -daysUntil(v.date);
    if (v.status === "Declined")
      out.push({
        id: `inv-${v.id}`,
        kind: "invite",
        title: `${sub} declined ${i.projectName(v.projectId)}`,
        where: "Invitation declined. Find another subcontractor or ask why",
        due: "Needs a decision",
        href: "/dashboard/subcontractors",
        tone: "owed",
        rank: -100,
        who: ini(sub),
        projectId: v.projectId,
      });
    else if (v.status === "Accepted" && v.finishRequested)
      out.push({
        id: `fin-${v.id}`,
        kind: "invite",
        title: `${sub} says its work on ${i.projectName(v.projectId)} is complete`,
        where: "Confirm it, or ask them to finish",
        due: "Waiting for you",
        href: "/dashboard/subcontractors",
        tone: "owed",
        rank: -60,
        who: ini(sub),
        projectId: v.projectId,
      });
    else if (v.status === "Pending" && age >= 3)
      out.push({
        id: `inv-${v.id}`,
        kind: "invite",
        title: `${sub} has not replied about ${i.projectName(v.projectId)}`,
        where: "Invitation waiting",
        due: `Sent ${age} days ago`,
        href: "/dashboard/subcontractors",
        tone: "neutral",
        rank: 5,
        who: ini(sub),
        projectId: v.projectId,
      });
  }

  return out.sort((a, b) => a.rank - b.rank);
}
