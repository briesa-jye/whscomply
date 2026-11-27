"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  INCIDENT_FLOW,
  INDUCTION_TOPICS,
  PREQUAL_ITEMS,
  INSPECTION_TEMPLATES,
  PERMIT_CHECKS,
  initialsOf,
  me,
  seedActions,
  seedDefects,
  seedDiaries,
  seedDrawings,
  seedInductions,
  seedNotices,
  seedRfis,
  seedSchedules,
  seedTasks,
  seedChemicals,
  seedDocs,
  seedDrills,
  seedPermits,
  seedPlant,
  seedVisitors,
  seedGateLog,
  seedMeetingTemplates,
  seedSiteOnboardings,
  newSiteOnboarding,
  siteOnboardingBlockers,
  siteOnboardingProblems,
  plantApproval,
  seedSiteRequests,
  seedAudit,
  seedIncidents,
  seedInspections,
  seedMembers,
  seedProjects,
  seedRisks,
  seedSettings,
  seedInvites,
  seedSubcontractors,
  seedSwms,
  seedTalks,
  seedWorkers,
  type Action,
  type Defect,
  type DiaryEntry,
  type Drawing,
  type InductionRecord,
  type InspectionSchedule,
  type Notice,
  type ProgTask,
  type Rfi,
  type Chemical,
  type Doc,
  type Drill,
  type MeetingKind,
  type Permit,
  type Plant,
  type Visitor,
  type GateEvent,
  type MeetingTemplate,
  type SiteOnboarding,
  type PlantCheck,
  type PlantDoc,
  type SiteRequest,
  type AuditArea,
  type AuditEvent,
  type Incident,
  type IncidentStatus,
  type Inspection,
  type InspResult,
  type Member,
  type Project,
  type Risk,
  type Settings,
  type Invite,
  type SubDoc,
  type Subcontractor,
  type Swms,
  type SwmsStep,
  type Talk,
  type Ticket,
  type Worker,
} from "@/lib/data";
import {
  contractorPl,
  newPlantChecks,
  OPERATOR_LABEL,
  plantBlockers,
  plantTypeByKey,
} from "@/lib/plant-types";
import { clearFiles, type Attachment } from "@/lib/files";
import { todayISO } from "@/lib/format";
import {
  MIN_CHARGE,
  makeInvoice,
  nextInvoiceId,
  prorationLines,
  SEED_INVOICES,
  type Proration,
} from "@/lib/billing";
import { PLANS } from "@/lib/billing";
import type { BuilderPlan } from "@/lib/plans";
import { ISO_PRICE, money } from "@/lib/iso/standards";
import type { IsoDocState, IsoProfile, IsoState, IsoStd } from "@/lib/iso/types";

const KEY = "whscomply-demo-v10";

export const ALL = "all";

type Saved = {
  /** the project picked in the top bar, or "all" */
  projectId: string;
  projects: Project[];
  workers: Worker[];
  subs: Subcontractor[];
  swms: Swms[];
  risks: Risk[];
  talks: Talk[];
  inspections: Inspection[];
  incidents: Incident[];
  actions: Action[];
  audit: AuditEvent[];
  members: Member[];
  settings: Settings;
  permits: Permit[];
  plant: Plant[];
  chemicals: Chemical[];
  drills: Drill[];
  visitors: Visitor[];
  docs: Doc[];
  /** checklists built by the user or the AI, offered alongside the standard inspection checklists */
  customTemplates: { id: string; name: string; items: string[] }[];
  diaries: DiaryEntry[];
  inductions: InductionRecord[];
  defects: Defect[];
  rfis: Rfi[];
  tasks: ProgTask[];
  notices: Notice[];
  drawings: Drawing[];
  schedules: InspectionSchedule[];
  invites: Invite[];
  /** who signed on and off each project gate, with the time */
  gateLog: GateEvent[];
  /** subcontractors asking for a worker to be allowed onto a project */
  siteRequests: SiteRequest[];
  /** what each kind of meeting records, edited by the client */
  meetingTemplates: MeetingTemplate[];
  /** each subcontractor's SWMS and SDS onboarding for each project it works on */
  siteOnboardings: SiteOnboarding[];
  iso: IsoState;
};

const SEED: Saved = {
  projectId: ALL,
  projects: seedProjects,
  workers: seedWorkers,
  subs: seedSubcontractors,
  swms: seedSwms,
  risks: seedRisks,
  talks: seedTalks,
  inspections: seedInspections,
  incidents: seedIncidents,
  actions: seedActions,
  audit: seedAudit,
  members: seedMembers,
  settings: seedSettings,
  permits: seedPermits,
  plant: seedPlant,
  chemicals: seedChemicals,
  drills: seedDrills,
  visitors: seedVisitors,
  docs: seedDocs,
  customTemplates: [],
  diaries: seedDiaries,
  inductions: seedInductions,
  defects: seedDefects,
  rfis: seedRfis,
  tasks: seedTasks,
  notices: seedNotices,
  drawings: seedDrawings,
  schedules: seedSchedules,
  invites: seedInvites,
  gateLog: seedGateLog,
  siteRequests: seedSiteRequests,
  meetingTemplates: seedMeetingTemplates,
  siteOnboardings: seedSiteOnboardings,
  iso: {
    profile: {
      company: seedSettings.company.name,
      abn: seedSettings.company.abn,
      address: "",
      state: "NSW",
      scope: "Residential and commercial building construction, alterations and fit-out",
      staff: "",
      sites: "",
      buildingTypes: ["Residential", "Commercial"],
      subcontractUse: "Heavy",
      hazards: "",
      topManagement: "",
      topTitle: "Managing Director",
      rep: "",
      existing: "",
      customers: "",
    },
    docs: {},
    purchases: {},
  },
};

/* ---- a tiny external store over localStorage, so state survives navigation and reloads ---- */

const listeners = new Set<() => void>();
let cacheRaw: string | null | undefined;
let cacheVal: Saved | null = null;

function valid(p: Saved | null): p is Saved {
  return (
    !!p &&
    typeof p.projectId === "string" &&
    Array.isArray(p.projects) &&
    Array.isArray(p.workers) &&
    Array.isArray(p.subs) &&
    Array.isArray(p.swms) &&
    Array.isArray(p.risks) &&
    Array.isArray(p.talks) &&
    Array.isArray(p.inspections) &&
    Array.isArray(p.incidents) &&
    Array.isArray(p.actions) &&
    Array.isArray(p.audit) &&
    Array.isArray(p.members) &&
    !!p.settings &&
    Array.isArray(p.permits) &&
    Array.isArray(p.plant) &&
    Array.isArray(p.chemicals) &&
    Array.isArray(p.drills) &&
    Array.isArray(p.visitors) &&
    Array.isArray(p.docs) &&
    Array.isArray(p.customTemplates) &&
    Array.isArray(p.diaries) &&
    Array.isArray(p.inductions) &&
    Array.isArray(p.defects) &&
    Array.isArray(p.rfis) &&
    Array.isArray(p.tasks) &&
    Array.isArray(p.notices) &&
    Array.isArray(p.drawings) &&
    Array.isArray(p.schedules) &&
    Array.isArray(p.invites) &&
    !!p.iso &&
    !!p.iso.profile &&
    !!p.iso.docs &&
    !!p.iso.purchases
  );
}

/** Fill in lists added after a browser first saved its demo state, so older saves keep their data. */
function migrate(p: Saved): Saved {
  return {
    ...p,
    gateLog: p.gateLog ?? [],
    siteRequests: p.siteRequests ?? [],
    meetingTemplates: p.meetingTemplates ?? seedMeetingTemplates,
    siteOnboardings: p.siteOnboardings ?? seedSiteOnboardings,
  };
}

function readSaved(): Saved | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    // blocked storage: stay on the in-memory copy
    return cacheVal;
  }
  if (raw === cacheRaw) return cacheVal;
  cacheRaw = raw;
  try {
    const p = raw ? (JSON.parse(raw) as Saved) : null;
    cacheVal = valid(p) ? migrate(p) : null;
  } catch {
    cacheVal = null;
  }
  return cacheVal;
}

function writeSaved(next: Saved) {
  cacheVal = next;
  try {
    const raw = JSON.stringify(next);
    localStorage.setItem(KEY, raw);
    cacheRaw = raw;
  } catch {
    // storage full or blocked: the demo still works for this visit
    cacheRaw = undefined;
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

const current = (): Saved => readSaved() ?? cacheVal ?? SEED;
const update = (fn: (s: Saved) => Saved) => writeSaved(fn(current()));

const uid = () =>
  Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);

/** "yyyy-mm-dd hh:mm" for now, the format used for gate and visitor times. */
const stamp = () => {
  const d = new Date();
  return `${todayISO()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

/** Audit log area for a kind of meeting. */
const meetingArea = (kind: MeetingKind): AuditArea =>
  kind === "Toolbox talk" ? "Toolbox" : "Meetings";

const nowTime = () =>
  new Date().toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

function ev(
  area: AuditArea,
  projectId: string,
  act: string,
  from: string,
  to: string,
): AuditEvent {
  // Changes made from the subcontractor portal are logged under the subcontractor, not the site manager.
  const st = current();
  const sub =
    st.settings.account === "subcontractor"
      ? st.subs.find((x) => x.id === st.settings.subId)
      : undefined;
  const person = sub ? sub.contact || sub.name : "";
  // Changes made from a worker's own profile are logged under that worker.
  const wk =
    st.settings.account === "worker"
      ? st.workers.find((x) => x.id === st.settings.workerId)
      : undefined;
  return {
    id: uid(),
    day: "Today",
    t: nowTime(),
    who: sub
      ? person
          .split(/\s+/)
          .slice(0, 2)
          .map((w) => w[0]?.toUpperCase())
          .join("")
      : wk
        ? wk.name
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase())
            .join("")
        : me.initials,
    name: sub ? `${person} (${sub.name})` : wk ? wk.name : me.name,
    act,
    from,
    to,
    area,
    projectId,
  };
}

/** Apply a change and append one audit entry, in a single write. */
const act = (fn: (s: Saved) => Saved, e: AuditEvent) =>
  update((s) => {
    const n = fn(s);
    return { ...n, audit: [e, ...n.audit] };
  });

const workerName = (s: Saved, id: string) =>
  s.workers.find((w) => w.id === id)?.name ?? "A worker";
const projectName = (s: Saved, id: string) =>
  s.projects.find((p) => p.id === id)?.name ?? "a project";

/* ---- inputs ---- */

export type NewProject = Pick<
  Project,
  "name" | "address" | "client" | "stage" | "manager" | "status"
>;
export type NewWorker = Pick<Worker, "name" | "role" | "company" | "phone"> & {
  projects: string[];
};
export type NewSub = Pick<
  Subcontractor,
  "name" | "trade" | "contact" | "phone"
> & { projects: string[]; email?: string };
export type NewSwms = {
  title: string;
  projectId: string;
  highRisk: boolean;
  owner: string;
  steps: Omit<SwmsStep, "id">[];
};
export type NewRisk = Omit<Risk, "id">;
/** Starting or scheduling a pre-start, toolbox talk or meeting from its own page. */
export type NewMeeting = {
  kind: MeetingKind;
  projectId: string;
  topic: string;
  presenter: string;
  notes: string;
  templateId: string;
  /** start straight away rather than scheduling */
  startNow: boolean;
  date: string;
  time?: string;
};

export type NewTalk = Pick<
  Talk,
  "projectId" | "topic" | "date" | "presenter" | "notes"
> & { kind?: MeetingKind };

export type NewPermit = Pick<
  Permit,
  | "projectId"
  | "kind"
  | "title"
  | "location"
  | "requestedBy"
  | "issuedTo"
  | "from"
  | "until"
>;
export type NewPlant = Pick<
  Plant,
  "projectId" | "name" | "kind" | "serial" | "owner" | "nextService" | "tagDue"
>;
/** Plant put forward for a site, by a subcontractor from its portal or by the builder. */
export type NewPlantSubmission = {
  projectId: string;
  name: string;
  typeKey: string;
  serial: string;
  /** "own" or a subcontractor id */
  ownerId: string;
  capacityT: number | null;
  flags: { roadRegistered: boolean; electrical: boolean; peopleLifting: boolean };
  operatorMode: "own" | "labour-hire" | "mixed";
  onSiteFrom: string;
  meter: { kind: "hours" | "km"; reading: number } | null;
  lastService: string;
  nextService: string;
  serviceReading: { last: number; next: number } | null;
  maintenance: {
    last: string;
    next: string;
    lastReading?: number;
    nextReading?: number;
  };
  tagDue: string | null;
  /** the profile photo of the whole machine */
  photo: Attachment[];
  docs: {
    key: string;
    kind: string;
    expires: string | null;
    files: Attachment[];
  }[];
};
export type NewChemical = Omit<Chemical, "id" | "status">;
export type NewDrill = Omit<Drill, "id">;
export type NewVisitor = Pick<
  Visitor,
  "projectId" | "name" | "company" | "purpose" | "host" | "inducted"
>;
export type NewDoc = Pick<
  Doc,
  "projectId" | "title" | "category" | "version" | "owner" | "reviewDue"
>;
export type NewIncident = Omit<
  Incident,
  "id" | "status" | "notifiable" | "cause"
>;
export type NewAction = Omit<Action, "id" | "status">;

type Store = Saved & {
  ready: boolean;
  setProject: (id: string) => void;

  addProject: (i: NewProject) => string;
  updateProject: (id: string, patch: Partial<Project>) => void;
  signOn: (projectId: string, workerId: string) => void;
  signOff: (projectId: string, workerId: string) => void;
  /** a subcontractor asks for one of its workers to be allowed onto a project */
  requestSiteAccess: (workerId: string, projectId: string) => void;
  decideSiteRequest: (
    id: string,
    decision: "Approved" | "Declined",
    note?: string,
  ) => void;
  cancelSiteRequest: (id: string) => void;

  addWorker: (i: NewWorker) => string;
  updateWorker: (id: string, patch: Partial<Worker>) => void;
  removeWorker: (id: string) => void;
  addTicket: (wid: string, t: Omit<Ticket, "id">) => void;
  removeTicket: (wid: string, tid: string) => void;
  induct: (wid: string, projectId: string) => void;

  addSub: (i: NewSub) => string;
  setApproved: (id: string, approved: boolean) => void;
  addDoc: (sid: string, d: Omit<SubDoc, "id">) => void;
  removeDoc: (sid: string, did: string) => void;

  addSwms: (i: NewSwms) => string;
  updateSwms: (id: string, patch: Partial<Swms>) => void;
  addStep: (id: string, step: Omit<SwmsStep, "id">) => void;
  removeStep: (id: string, stepId: string) => void;
  signSwms: (id: string, workerId: string) => void;
  newVersion: (id: string) => string;

  addRisk: (i: NewRisk) => void;
  updateRisk: (id: string, patch: Partial<Risk>) => void;
  removeRisk: (id: string) => void;

  addTalk: (i: NewTalk) => string;

  addPermit: (i: NewPermit) => string;
  toggleCheck: (id: string, checkId: string) => void;
  setPermitStatus: (id: string, status: Permit["status"]) => void;

  addPlant: (i: NewPlant) => void;
  submitPlant: (i: NewPlantSubmission) => string;
  resubmitPlant: (id: string, i: NewPlantSubmission) => void;
  withdrawPlant: (id: string) => void;
  verifyPlantDoc: (id: string, docId: string, verified: boolean) => void;
  setPlantCheck: (
    id: string,
    checkId: string,
    result: PlantCheck["result"],
    note?: string,
  ) => void;
  decidePlant: (
    id: string,
    decision: "Approved" | "Declined",
    note?: string,
  ) => void;
  logPrestart: (id: string) => void;
  logService: (id: string, nextService: string) => void;
  setPlantStatus: (
    id: string,
    status: Plant["status"],
    defect?: string,
  ) => void;
  tagPlant: (id: string, nextDue: string) => void;

  addChemical: (i: NewChemical) => void;
  /** open, or find, a subcontractor's onboarding for a project */
  startSiteOnboarding: (subId: string, projectId: string) => string;
  saveSiteOnboarding: (
    id: string,
    patch: Partial<
      Pick<SiteOnboarding, "swms" | "chemicals" | "noChemicals" | "plantLater">
    >,
  ) => void;
  submitSiteOnboarding: (id: string) => void;
  verifySiteItem: (
    id: string,
    list: "swms" | "chemicals",
    itemId: string,
    verified: boolean,
  ) => void;
  decideSiteOnboarding: (
    id: string,
    decision: "Approved" | "Declined",
    note?: string,
  ) => void;
  updateChemical: (id: string, patch: Partial<Chemical>) => void;

  addDrill: (i: NewDrill) => void;
  updateEmergency: (
    projectId: string,
    patch: Partial<
      Pick<Project, "assembly" | "hospital" | "emergencyContact" | "wardens">
    >,
  ) => void;
  setHours: (projectId: string, hours: number) => void;

  signInVisitor: (i: NewVisitor) => void;
  signOutVisitor: (id: string) => void;

  addDocument: (i: NewDoc) => void;
  addTemplate: (name: string, items: string[]) => void;

  /** generic create, change and delete for the simple record lists */
  add: <K extends Coll>(k: K, rec: Omit<Rec<K>, "id">, e: Note) => string;
  patch: <K extends Coll>(
    k: K,
    id: string,
    p: Partial<Rec<K>>,
    e?: Note,
  ) => void;
  remove: <K extends Coll>(k: K, id: string, e?: Note) => void;
  recordInduction: (i: Omit<InductionRecord, "id" | "date">) => void;
  setPrequal: (sid: string, itemId: string, done: boolean) => void;
  setItemFiles: (id: string, itemId: string, files: Attachment[]) => void;
  setDocFiles: (sid: string, did: string, files: Attachment[]) => void;
  updateDocument: (id: string, patch: Partial<Doc>) => void;
  removeTemplate: (id: string) => void;
  signDoc: (id: string, workerId: string) => void;
  reviewDoc: (id: string, version: string, reviewDue: string) => void;
  toggleAttendance: (id: string, workerId: string) => void;
  updateTalk: (id: string, patch: Partial<Talk>) => void;
  removeTalk: (id: string) => void;
  createMeeting: (i: NewMeeting) => string;
  startMeeting: (id: string) => void;
  addAttendee: (id: string, workerId: string) => void;
  removeAttendee: (id: string, workerId: string) => void;
  signMeeting: (
    id: string,
    workerId: string,
    path: string,
    mode: "device" | "profile",
  ) => void;
  sendToProfile: (id: string, workerId: string) => void;
  completeMeeting: (id: string) => void;
  saveMeetingTemplate: (t: MeetingTemplate) => void;
  removeMeetingTemplate: (id: string) => void;
  setDefaultMeetingTemplate: (id: string) => void;

  startInspection: (
    projectId: string,
    kind: string,
    inspector: string,
  ) => string;
  setResult: (
    id: string,
    itemId: string,
    result: InspResult,
    note?: string,
  ) => void;
  completeInspection: (id: string) => void;

  reportIncident: (i: NewIncident) => string;
  updateIncident: (id: string, patch: Partial<Incident>) => void;
  advanceIncident: (id: string, to: IncidentStatus) => void;

  addAction: (i: NewAction) => void;
  toggleAction: (id: string) => void;
  removeAction: (id: string) => void;

  inviteMember: (m: Pick<Member, "name" | "email" | "role">) => void;
  updateMember: (id: string, patch: Partial<Member>) => void;
  removeMember: (id: string) => void;
  updateCompany: (patch: Partial<Settings["company"]>) => void;
  setNotify: (patch: Partial<Settings["notify"]>) => void;
  setWarnDays: (n: number) => void;
  /** switch plan during the free trial: nothing is charged */
  setPlan: (plan: BuilderPlan) => void;
  /** upgrade now and record the part-month invoice (none if under the minimum charge) */
  upgradePlan: (p: Proration) => void;
  /** book a downgrade for the next billing date */
  scheduleDowngrade: (plan: BuilderPlan, on: string) => void;
  cancelPlanChange: () => void;
  applyDuePlanChange: (today: string) => void;
  updateCard: (card: { brand: string; last4: string; exp: string; name: string }) => void;
  setIsoProfile: (patch: Partial<IsoProfile>) => void;
  saveIsoDoc: (key: string, doc: IsoDocState, note?: string) => void;
  removeIsoDoc: (key: string) => void;
  buyIso: (std: IsoStd, card: { brand: string; last4: string }) => string;
  respondInvite: (id: string, accept: boolean) => void;
  /** withdraw an invitation the subcontractor has not answered */
  cancelInvite: (id: string) => void;
  /** take a subcontractor off a project: the project leaves them, their crew leave the site, the records stay */
  removeSubFromProject: (subId: string, projectId: string) => void;
  /** the subcontractor says its work on a project is done */
  requestFinish: (subId: string, projectId: string) => void;
  /** the builder confirms the subcontractor is done: crew come off the project and the work is kept as history */
  finishSubOnProject: (subId: string, projectId: string) => void;
  /** close a project and store it: everyone is signed off, subcontractors are finished, records stay */
  closeProject: (id: string, note?: string) => void;
  reopenProject: (id: string) => void;
  inviteSub: (subId: string, projectId: string) => void;
  updateSub: (
    id: string,
    patch: Partial<Pick<Subcontractor, "name" | "trade" | "contact" | "phone">>,
  ) => void;
  resetDemo: () => void;
};

type Coll =
  | "diaries"
  | "inductions"
  | "defects"
  | "rfis"
  | "tasks"
  | "notices"
  | "drawings"
  | "schedules";
type Rec<K extends Coll> = Saved[K][number];
/** the audit line written with a change to one of the simple record lists */
type Note = {
  area: AuditArea;
  projectId: string;
  act: string;
  from?: string;
  to: string;
};

const patchIn = <T extends { id: string }>(
  list: T[],
  id: string,
  fn: (t: T) => T,
) => list.map((t) => (t.id === id ? fn(t) : t));

/** Takes a subcontractor off a project in state: their project, their crew and the gate. Records of what they signed stay. */
function detachSub(
  s: Saved,
  subId: string,
  projectId: string,
  status: "Removed" | "Finished",
): Saved {
  const crew = new Set(
    s.workers.filter((w) => w.company === subId).map((w) => w.id),
  );
  const stamp = status === "Finished" ? { finishedAt: todayISO() } : {};
  const has = s.invites.some(
    (i) =>
      i.subId === subId && i.projectId === projectId && i.status === "Accepted",
  );
  return {
    ...s,
    subs: patchIn(s.subs, subId, (x) => ({
      ...x,
      projects: x.projects.filter((p) => p !== projectId),
    })),
    workers: s.workers.map((w) =>
      crew.has(w.id)
        ? { ...w, projects: w.projects.filter((p) => p !== projectId) }
        : w,
    ),
    projects: patchIn(s.projects, projectId, (p) => ({
      ...p,
      onSite: p.onSite.filter((w) => !crew.has(w)),
    })),
    invites: has
      ? s.invites.map((i) =>
          i.subId === subId && i.projectId === projectId && i.status === "Accepted"
            ? { ...i, status, ...stamp }
            : i,
        )
      : [
          {
            id: `inv-${uid()}`,
            subId,
            projectId,
            from: s.settings.company.name,
            by: me.name,
            date: todayISO(),
            status,
            ...stamp,
          },
          ...s.invites,
        ],
  };
}

const actions: Omit<Store, keyof Saved | "ready"> = {
  setProject: (id) => update((s) => ({ ...s, projectId: id })),

  addProject: (i) => {
    const id = `p-${uid()}`;
    act(
      (s) => ({
        ...s,
        projects: [
          ...s.projects,
          {
            ...i,
            id,
            start: todayISO(),
            onSite: [],
            hours: 0,
            assembly: "",
            hospital: "",
            emergencyContact: "",
            wardens: "",
            locations: [],
            inductionTopics: INDUCTION_TOPICS,
          },
        ],
      }),
      ev(
        "Projects",
        id,
        `created the project ${i.name}`,
        "No project",
        i.status,
      ),
    );
    return id;
  },
  updateProject: (id, patch) =>
    act(
      (s) => ({
        ...s,
        projects: patchIn(s.projects, id, (p) => ({ ...p, ...patch })),
      }),
      ev("Projects", id, "updated the project details", "Previous", "Updated"),
    ),
  signOn: (projectId, workerId) => {
    const s0 = current();
    act(
      (s) => ({
        ...s,
        projects: patchIn(s.projects, projectId, (p) =>
          p.onSite.includes(workerId)
            ? p
            : { ...p, onSite: [...p.onSite, workerId] },
        ),
        gateLog: s.projects
          .find((p) => p.id === projectId)
          ?.onSite.includes(workerId)
          ? s.gateLog
          : [
              {
                id: `g-${uid()}`,
                projectId,
                workerId,
                kind: "on" as const,
                at: stamp(),
              },
              ...s.gateLog,
            ],
      }),
      ev(
        "People",
        projectId,
        `signed ${workerName(s0, workerId)} on at ${projectName(s0, projectId)}`,
        "Off site",
        "On site",
      ),
    );
  },
  signOff: (projectId, workerId) => {
    const s0 = current();
    act(
      (s) => ({
        ...s,
        projects: patchIn(s.projects, projectId, (p) => ({
          ...p,
          onSite: p.onSite.filter((w) => w !== workerId),
        })),
        gateLog: s.projects
          .find((p) => p.id === projectId)
          ?.onSite.includes(workerId)
          ? [
              {
                id: `g-${uid()}`,
                projectId,
                workerId,
                kind: "off" as const,
                at: stamp(),
              },
              ...s.gateLog,
            ]
          : s.gateLog,
      }),
      ev(
        "People",
        projectId,
        `signed ${workerName(s0, workerId)} off at ${projectName(s0, projectId)}`,
        "On site",
        "Off site",
      ),
    );
  },

  requestSiteAccess: (workerId, projectId) => {
    const s0 = current();
    const w = s0.workers.find((x) => x.id === workerId);
    if (!w || w.projects.includes(projectId)) return;
    if (
      s0.siteRequests.some(
        (r) =>
          r.workerId === workerId &&
          r.projectId === projectId &&
          r.status === "Pending",
      )
    )
      return;
    act(
      (s) => ({
        ...s,
        siteRequests: [
          {
            id: `sr-${uid()}`,
            projectId,
            workerId,
            subId: w.company,
            requestedAt: stamp(),
            status: "Pending" as const,
          },
          ...s.siteRequests,
        ],
      }),
      ev(
        "People",
        projectId,
        `asked for ${w.name} to be allowed on ${projectName(s0, projectId)}`,
        "Not allocated",
        "Requested",
      ),
    );
  },
  decideSiteRequest: (id, decision, note) => {
    const s0 = current();
    const r = s0.siteRequests.find((x) => x.id === id);
    if (!r || r.status !== "Pending") return;
    act(
      (s) => ({
        ...s,
        siteRequests: s.siteRequests.map((x) =>
          x.id === id
            ? {
                ...x,
                status: decision,
                decidedAt: stamp(),
                decidedBy: me.name,
                note: note?.trim() || undefined,
              }
            : x,
        ),
        workers:
          decision === "Approved"
            ? patchIn(s.workers, r.workerId, (w) =>
                w.projects.includes(r.projectId)
                  ? w
                  : { ...w, projects: [...w.projects, r.projectId] },
              )
            : s.workers,
      }),
      ev(
        "People",
        r.projectId,
        `${decision === "Approved" ? "approved" : "declined"} ${workerName(s0, r.workerId)} for ${projectName(s0, r.projectId)}`,
        "Requested",
        decision,
      ),
    );
  },
  cancelSiteRequest: (id) => {
    const s0 = current();
    const r = s0.siteRequests.find((x) => x.id === id);
    if (!r || r.status !== "Pending") return;
    act(
      (s) => ({
        ...s,
        siteRequests: s.siteRequests.map((x) =>
          x.id === id ? { ...x, status: "Cancelled" as const } : x,
        ),
      }),
      ev(
        "People",
        r.projectId,
        `withdrew the request for ${workerName(s0, r.workerId)} at ${projectName(s0, r.projectId)}`,
        "Requested",
        "Withdrawn",
      ),
    );
  },

  addWorker: (i) => {
    const id = `w-${uid()}`;
    act(
      (s) => ({
        ...s,
        workers: [...s.workers, { ...i, id, tickets: [], inducted: [] }],
      }),
      ev(
        "People",
        i.projects[0] ?? ALL,
        `added ${i.name} to the workforce`,
        "No record",
        "Added",
      ),
    );
    return id;
  },
  updateWorker: (id, patch) =>
    update((s) => ({
      ...s,
      workers: patchIn(s.workers, id, (w) => ({ ...w, ...patch })),
    })),
  removeWorker: (id) => {
    const s0 = current();
    act(
      (s) => ({
        ...s,
        workers: s.workers.filter((w) => w.id !== id),
        projects: s.projects.map((p) => ({
          ...p,
          onSite: p.onSite.filter((w) => w !== id),
        })),
      }),
      ev("People", ALL, `removed ${workerName(s0, id)}`, "Active", "Removed"),
    );
  },
  addTicket: (wid, t) => {
    const s0 = current();
    act(
      (s) => ({
        ...s,
        workers: patchIn(s.workers, wid, (w) => ({
          ...w,
          tickets: [...w.tickets, { ...t, id: uid() }],
        })),
      }),
      ev(
        "People",
        ALL,
        `recorded ${t.kind} for ${workerName(s0, wid)}`,
        "No ticket",
        t.expires ?? "No expiry",
      ),
    );
  },
  removeTicket: (wid, tid) =>
    update((s) => ({
      ...s,
      workers: patchIn(s.workers, wid, (w) => ({
        ...w,
        tickets: w.tickets.filter((t) => t.id !== tid),
      })),
    })),
  induct: (wid, projectId) => {
    const s0 = current();
    act(
      (s) => ({
        ...s,
        workers: patchIn(s.workers, wid, (w) =>
          w.inducted.includes(projectId)
            ? w
            : { ...w, inducted: [...w.inducted, projectId] },
        ),
      }),
      ev(
        "People",
        projectId,
        `recorded the ${projectName(s0, projectId)} induction for ${workerName(s0, wid)}`,
        "Not inducted",
        "Inducted",
      ),
    );
  },

  addSub: (i) => {
    const id = `s-${uid()}`;
    act(
      (s) => ({
        ...s,
        // The subcontractor joins a project by accepting an invitation, not by being added to it.
        invites: [
          ...i.projects.map((projectId) => ({
            id: `inv-${uid()}`,
            subId: id,
            projectId,
            from: s.settings.company.name,
            by: me.name,
            date: todayISO(),
            status: "Pending" as const,
          })),
          ...s.invites,
        ],
        subs: [
          ...s.subs,
          {
            name: i.name,
            trade: i.trade,
            contact: i.contact,
            phone: i.phone,
            email: i.email?.trim() || undefined,
            claimed: false,
            projects: [],
            id,
            approved: false,
            docs: [],
            prequal: PREQUAL_ITEMS.map((text, n) => ({
              id: `q${n}`,
              text,
              done: false,
            })),
          },
        ],
      }),
      ev(
        "People",
        i.projects[0] ?? ALL,
        i.projects.length
          ? `added the subcontractor ${i.name} and invited them to ${i.projects.length} project${i.projects.length === 1 ? "" : "s"}`
          : `added the subcontractor ${i.name}`,
        "No record",
        "Pending",
      ),
    );
    return id;
  },
  setApproved: (id, approved) => {
    const name =
      current().subs.find((x) => x.id === id)?.name ?? "A subcontractor";
    act(
      (s) => ({ ...s, subs: patchIn(s.subs, id, (x) => ({ ...x, approved })) }),
      ev(
        "People",
        ALL,
        `${approved ? "approved" : "withdrew approval for"} ${name}`,
        approved ? "Pending" : "Approved",
        approved ? "Approved" : "Pending",
      ),
    );
  },
  addDoc: (sid, d) =>
    update((s) => ({
      ...s,
      subs: patchIn(s.subs, sid, (x) => ({
        ...x,
        docs: [...x.docs, { ...d, id: uid() }],
      })),
    })),
  removeDoc: (sid, did) =>
    update((s) => ({
      ...s,
      subs: patchIn(s.subs, sid, (x) => ({
        ...x,
        docs: x.docs.filter((d) => d.id !== did),
      })),
    })),

  addSwms: (i) => {
    const id = `sw-${uid()}`;
    const s0 = current();
    const required = s0.workers
      .filter((w) => w.projects.includes(i.projectId))
      .map((w) => w.id);
    act(
      (s) => ({
        ...s,
        swms: [
          {
            id,
            title: i.title,
            projectId: i.projectId,
            version: 1,
            status: "Draft",
            highRisk: i.highRisk,
            owner: i.owner,
            updated: todayISO(),
            required,
            signed: [],
            steps: i.steps.map((st) => ({ ...st, id: uid() })),
          },
          ...s.swms,
        ],
      }),
      ev(
        "SWMS",
        i.projectId,
        `created the SWMS ${i.title}`,
        "No SWMS",
        "Draft v1",
      ),
    );
    return id;
  },
  updateSwms: (id, patch) => {
    const sw = current().swms.find((x) => x.id === id);
    act(
      (s) => ({
        ...s,
        swms: patchIn(s.swms, id, (x) => ({
          ...x,
          ...patch,
          updated: todayISO(),
        })),
      }),
      ev(
        "SWMS",
        sw?.projectId ?? ALL,
        `updated ${sw?.title ?? "a SWMS"}`,
        patch.status ? (sw?.status ?? "") : "Previous",
        patch.status ?? "Updated",
      ),
    );
  },
  addStep: (id, step) =>
    update((s) => ({
      ...s,
      swms: patchIn(s.swms, id, (x) => ({
        ...x,
        steps: [...x.steps, { ...step, id: uid() }],
        // a changed method means the crew must sign again
        signed: [],
        updated: todayISO(),
      })),
    })),
  removeStep: (id, stepId) =>
    update((s) => ({
      ...s,
      swms: patchIn(s.swms, id, (x) => ({
        ...x,
        steps: x.steps.filter((st) => st.id !== stepId),
        signed: [],
        updated: todayISO(),
      })),
    })),
  signSwms: (id, workerId) => {
    const s0 = current();
    const sw = s0.swms.find((x) => x.id === id);
    act(
      (s) => ({
        ...s,
        swms: patchIn(s.swms, id, (x) =>
          x.signed.includes(workerId)
            ? x
            : {
                ...x,
                signed: [...x.signed, workerId],
                required: x.required.includes(workerId)
                  ? x.required
                  : [...x.required, workerId],
              },
        ),
      }),
      ev(
        "SWMS",
        sw?.projectId ?? ALL,
        `signed ${sw?.title ?? "the SWMS"} for ${workerName(s0, workerId)}`,
        "Unsigned",
        `Signed v${sw?.version ?? 1}`,
      ),
    );
  },
  newVersion: (id) => {
    const nid = `sw-${uid()}`;
    const sw = current().swms.find((x) => x.id === id);
    if (!sw) return id;
    act(
      (s) => ({
        ...s,
        swms: [
          {
            ...sw,
            id: nid,
            version: sw.version + 1,
            status: "Draft",
            signed: [],
            updated: todayISO(),
          },
          ...patchIn(s.swms, id, (x) => ({
            ...x,
            status: "Superseded" as const,
          })),
        ],
      }),
      ev(
        "SWMS",
        sw.projectId,
        `started version ${sw.version + 1} of ${sw.title}`,
        `v${sw.version}`,
        `v${sw.version + 1} draft`,
      ),
    );
    return nid;
  },

  addRisk: (i) =>
    act(
      (s) => ({ ...s, risks: [{ ...i, id: `r-${uid()}` }, ...s.risks] }),
      ev(
        "Risks",
        i.projectId,
        `added the risk ${i.hazard}`,
        "Not on register",
        "Open",
      ),
    ),
  updateRisk: (id, patch) => {
    const r = current().risks.find((x) => x.id === id);
    act(
      (s) => ({
        ...s,
        risks: patchIn(s.risks, id, (x) => ({ ...x, ...patch })),
      }),
      ev(
        "Risks",
        r?.projectId ?? ALL,
        `updated the risk ${r?.hazard ?? ""}`.trim(),
        patch.status ? (r?.status ?? "") : "Previous",
        patch.status ?? "Updated",
      ),
    );
  },
  removeRisk: (id) => {
    const r = current().risks.find((x) => x.id === id);
    act(
      (s) => ({ ...s, risks: s.risks.filter((x) => x.id !== id) }),
      ev(
        "Risks",
        r?.projectId ?? ALL,
        `removed the risk ${r?.hazard ?? ""}`.trim(),
        "On register",
        "Removed",
      ),
    );
  },

  addTalk: (i) => {
    const id = `tb-${uid()}`;
    const expected = current()
      .workers.filter((w) => w.projects.includes(i.projectId))
      .map((w) => w.id);
    act(
      (s) => ({
        ...s,
        talks: [{ ...i, id, expected, attended: [] }, ...s.talks],
      }),
      ev(
        i.kind && i.kind !== "Toolbox talk" ? "Meetings" : "Toolbox",
        i.projectId,
        `scheduled the ${(i.kind ?? "Toolbox talk").toLowerCase()} ${i.topic}`,
        "Not scheduled",
        i.date,
      ),
    );
    return id;
  },
  toggleAttendance: (id, workerId) => {
    const s0 = current();
    const t = s0.talks.find((x) => x.id === id);
    const was = t?.attended.includes(workerId) ?? false;
    act(
      (s) => ({
        ...s,
        talks: patchIn(s.talks, id, (x) => ({
          ...x,
          attended: was
            ? x.attended.filter((w) => w !== workerId)
            : [...x.attended, workerId],
        })),
      }),
      ev(
        "Toolbox",
        t?.projectId ?? ALL,
        `${was ? "removed" : "recorded"} ${workerName(s0, workerId)} ${was ? "from" : "at"} ${t?.topic ?? "the talk"}`,
        was ? "Attended" : "Absent",
        was ? "Absent" : "Attended",
      ),
    );
  },
  updateTalk: (id, patch) =>
    update((s) => ({
      ...s,
      talks: patchIn(s.talks, id, (x) => ({ ...x, ...patch })),
    })),
  removeTalk: (id) =>
    update((s) => ({ ...s, talks: s.talks.filter((x) => x.id !== id) })),

  createMeeting: (i) => {
    const s0 = current();
    const tpl =
      s0.meetingTemplates.find((t) => t.id === i.templateId) ??
      s0.meetingTemplates.find((t) => t.kind === i.kind && t.isDefault);
    const id = `tb-${uid()}`;
    const crew = s0.workers
      .filter((w) => w.projects.includes(i.projectId))
      .map((w) => w.id);
    const project = s0.projects.find((p) => p.id === i.projectId);
    const onSite = crew.filter((w) => project?.onSite.includes(w));
    const now = stamp();
    const talk: Talk = {
      id,
      projectId: i.projectId,
      kind: i.kind,
      topic: i.topic,
      presenter: i.presenter,
      notes: i.notes,
      date: i.startNow ? todayISO() : i.date,
      time: i.startNow ? now.slice(11) : i.time || undefined,
      expected: i.startNow && onSite.length ? onSite : crew,
      attended: [],
      signatures: [],
      sentTo: [],
      answers: {},
      status: i.startNow ? "In progress" : "Scheduled",
      spontaneous: i.startNow || undefined,
      templateId: tpl?.id,
      templateName: tpl?.name,
      snapshot: tpl ? JSON.parse(JSON.stringify(tpl.sections)) : undefined,
      startedAt: i.startNow ? now : undefined,
    };
    act(
      (s) => ({ ...s, talks: [talk, ...s.talks] }),
      ev(
        meetingArea(i.kind),
        i.projectId,
        `${i.startNow ? "started" : "scheduled"} the ${i.kind.toLowerCase()} ${i.topic}`,
        "Not scheduled",
        i.startNow ? "In progress" : i.date,
      ),
    );
    return id;
  },
  startMeeting: (id) => {
    const s0 = current();
    const t = s0.talks.find((x) => x.id === id);
    if (!t || t.status === "In progress" || t.status === "Completed") return;
    const kind = t.kind ?? "Toolbox talk";
    const tpl =
      s0.meetingTemplates.find((x) => x.id === t.templateId) ??
      s0.meetingTemplates.find((x) => x.kind === kind && x.isDefault);
    const now = stamp();
    act(
      (s) => ({
        ...s,
        talks: patchIn(s.talks, id, (x) => ({
          ...x,
          status: "In progress" as const,
          startedAt: now,
          templateId: x.templateId ?? tpl?.id,
          templateName: x.templateName ?? tpl?.name,
          snapshot:
            x.snapshot ??
            (tpl ? JSON.parse(JSON.stringify(tpl.sections)) : undefined),
          signatures: x.signatures ?? [],
          sentTo: x.sentTo ?? [],
          answers: x.answers ?? {},
        })),
      }),
      ev(meetingArea(kind), t.projectId, `started ${t.topic}`, "Scheduled", "In progress"),
    );
  },
  addAttendee: (id, workerId) =>
    update((s) => ({
      ...s,
      talks: patchIn(s.talks, id, (x) =>
        x.expected.includes(workerId)
          ? x
          : { ...x, expected: [...x.expected, workerId] },
      ),
    })),
  removeAttendee: (id, workerId) =>
    update((s) => ({
      ...s,
      talks: patchIn(s.talks, id, (x) =>
        (x.signatures ?? []).some((g) => g.workerId === workerId)
          ? x
          : {
              ...x,
              expected: x.expected.filter((w) => w !== workerId),
              sentTo: (x.sentTo ?? []).filter((w) => w !== workerId),
            },
      ),
    })),
  signMeeting: (id, workerId, path, mode) => {
    const s0 = current();
    const t = s0.talks.find((x) => x.id === id);
    if (!t || (t.signatures ?? []).some((g) => g.workerId === workerId)) return;
    act(
      (s) => ({
        ...s,
        talks: patchIn(s.talks, id, (x) => ({
          ...x,
          signatures: [
            ...(x.signatures ?? []),
            { workerId, at: stamp(), path, mode },
          ],
          attended: x.attended.includes(workerId)
            ? x.attended
            : [...x.attended, workerId],
          expected: x.expected.includes(workerId)
            ? x.expected
            : [...x.expected, workerId],
        })),
      }),
      ev(
        meetingArea(t.kind ?? "Toolbox talk"),
        t.projectId,
        `${workerName(s0, workerId)} signed ${t.topic}`,
        "Not signed",
        "Signed",
      ),
    );
  },
  sendToProfile: (id, workerId) =>
    update((s) => ({
      ...s,
      talks: patchIn(s.talks, id, (x) => ({
        ...x,
        expected: x.expected.includes(workerId)
          ? x.expected
          : [...x.expected, workerId],
        sentTo: (x.sentTo ?? []).includes(workerId)
          ? (x.sentTo ?? [])
          : [...(x.sentTo ?? []), workerId],
      })),
    })),
  completeMeeting: (id) => {
    const s0 = current();
    const t = s0.talks.find((x) => x.id === id);
    if (!t || t.status === "Completed") return;
    act(
      (s) => ({
        ...s,
        talks: patchIn(s.talks, id, (x) => ({
          ...x,
          status: "Completed" as const,
          completedAt: stamp(),
        })),
      }),
      ev(
        meetingArea(t.kind ?? "Toolbox talk"),
        t.projectId,
        `completed ${t.topic} with ${(t.signatures ?? []).length} signature${(t.signatures ?? []).length === 1 ? "" : "s"}`,
        "In progress",
        "Completed",
      ),
    );
  },
  saveMeetingTemplate: (t) =>
    update((s) => {
      const exists = s.meetingTemplates.some((x) => x.id === t.id);
      const list = exists
        ? s.meetingTemplates.map((x) => (x.id === t.id ? t : x))
        : [...s.meetingTemplates, t];
      // only one default per kind
      return {
        ...s,
        meetingTemplates: list.map((x) =>
          t.isDefault && x.kind === t.kind && x.id !== t.id
            ? { ...x, isDefault: false }
            : x,
        ),
      };
    }),
  removeMeetingTemplate: (id) =>
    update((s) => {
      const t = s.meetingTemplates.find((x) => x.id === id);
      if (!t) return s;
      const sameKind = s.meetingTemplates.filter((x) => x.kind === t.kind);
      if (sameKind.length < 2) return s;
      const rest = s.meetingTemplates.filter((x) => x.id !== id);
      const next = rest.find((x) => x.kind === t.kind)!;
      return {
        ...s,
        meetingTemplates: rest.map((x) =>
          t.isDefault && x.id === next.id ? { ...x, isDefault: true } : x,
        ),
      };
    }),
  setDefaultMeetingTemplate: (id) =>
    update((s) => {
      const t = s.meetingTemplates.find((x) => x.id === id);
      if (!t) return s;
      return {
        ...s,
        meetingTemplates: s.meetingTemplates.map((x) =>
          x.kind === t.kind ? { ...x, isDefault: x.id === id } : x,
        ),
      };
    }),

  startInspection: (projectId, kind, inspector) => {
    const id = `in-${uid()}`;
    const source =
      INSPECTION_TEMPLATES[kind] ??
      current().customTemplates.find((t) => t.name === kind)?.items ??
      [];
    const items = source.map((text, i) => ({
      id: `i${i}`,
      text,
      result: null as InspResult,
      note: "",
    }));
    act(
      (s) => ({
        ...s,
        inspections: [
          {
            id,
            projectId,
            title: kind,
            kind,
            date: todayISO(),
            inspector,
            items,
            status: "In progress",
          },
          ...s.inspections,
        ],
      }),
      ev(
        "Inspections",
        projectId,
        `started a ${kind.toLowerCase()}`,
        "Not started",
        "In progress",
      ),
    );
    return id;
  },
  setResult: (id, itemId, result, note) => {
    const insp = current().inspections.find((x) => x.id === id);
    const item = insp?.items.find((i) => i.id === itemId);
    update((s) => {
      let next: Saved = {
        ...s,
        inspections: patchIn(s.inspections, id, (x) => ({
          ...x,
          items: x.items.map((i) =>
            i.id === itemId ? { ...i, result, note: note ?? i.note } : i,
          ),
        })),
      };
      // a failed item always leaves a corrective action behind
      if (result === "fail" && insp && item) {
        const title = `Fix: ${item.text}`;
        const exists = next.actions.some(
          (a) =>
            a.title === title &&
            a.sourceLabel === insp.title &&
            a.status === "Open",
        );
        if (!exists)
          next = {
            ...next,
            actions: [
              {
                id: `a-${uid()}`,
                projectId: insp.projectId,
                title,
                source: "Inspection",
                sourceLabel: insp.title,
                owner: insp.inspector,
                due: todayISO(),
                status: "Open",
              },
              ...next.actions,
            ],
            audit: [
              ev(
                "Inspections",
                insp.projectId,
                `failed "${item.text}" and raised a corrective action`,
                "Unchecked",
                "Failed",
              ),
              ...next.audit,
            ],
          };
      }
      return next;
    });
  },
  completeInspection: (id) => {
    const insp = current().inspections.find((x) => x.id === id);
    act(
      (s) => ({
        ...s,
        inspections: patchIn(s.inspections, id, (x) => ({
          ...x,
          status: "Complete",
        })),
      }),
      ev(
        "Inspections",
        insp?.projectId ?? ALL,
        `completed the ${insp?.title.toLowerCase() ?? "inspection"}`,
        "In progress",
        "Complete",
      ),
    );
  },

  reportIncident: (i) => {
    const id = `inc-${uid()}`;
    act(
      (s) => ({
        ...s,
        incidents: [
          { ...i, id, status: "Reported", notifiable: null, cause: "" },
          ...s.incidents,
        ],
      }),
      ev(
        "Incidents",
        i.projectId,
        `reported a ${i.type.toLowerCase()}: ${i.title}`,
        "No report",
        "Reported",
      ),
    );
    return id;
  },
  updateIncident: (id, patch) =>
    update((s) => ({
      ...s,
      incidents: patchIn(s.incidents, id, (x) => ({ ...x, ...patch })),
    })),
  advanceIncident: (id, to) => {
    const inc = current().incidents.find((x) => x.id === id);
    act(
      (s) => ({
        ...s,
        incidents: patchIn(s.incidents, id, (x) => ({ ...x, status: to })),
      }),
      ev(
        "Incidents",
        inc?.projectId ?? ALL,
        `moved ${inc?.title ?? "an incident"} to ${to}`,
        inc?.status ?? "",
        to,
      ),
    );
  },

  addAction: (i) =>
    act(
      (s) => ({
        ...s,
        actions: [{ ...i, id: `a-${uid()}`, status: "Open" }, ...s.actions],
      }),
      ev(
        "Incidents",
        i.projectId,
        `raised the action ${i.title}`,
        "No action",
        "Open",
      ),
    ),
  toggleAction: (id) => {
    const a = current().actions.find((x) => x.id === id);
    const done = a?.status === "Done";
    act(
      (s) => ({
        ...s,
        actions: patchIn(s.actions, id, (x) => ({
          ...x,
          status: done ? "Open" : "Done",
        })),
      }),
      ev(
        "Incidents",
        a?.projectId ?? ALL,
        `${done ? "reopened" : "completed"} the action ${a?.title ?? ""}`.trim(),
        done ? "Done" : "Open",
        done ? "Open" : "Done",
      ),
    );
  },
  removeAction: (id) =>
    update((s) => ({ ...s, actions: s.actions.filter((x) => x.id !== id) })),

  inviteMember: (m) =>
    act(
      (s) => ({
        ...s,
        members: [
          ...s.members,
          { ...m, id: `m-${uid()}`, status: "Invited", lastActive: "Never" },
        ],
      }),
      ev(
        "Settings",
        ALL,
        `invited ${m.name} as ${m.role}`,
        "Not invited",
        "Invited",
      ),
    ),
  updateMember: (id, patch) =>
    update((s) => ({
      ...s,
      members: patchIn(s.members, id, (m) => ({ ...m, ...patch })),
    })),
  removeMember: (id) =>
    update((s) => ({ ...s, members: s.members.filter((m) => m.id !== id) })),
  updateCompany: (patch) =>
    update((s) => ({
      ...s,
      settings: { ...s.settings, company: { ...s.settings.company, ...patch } },
    })),
  setNotify: (patch) =>
    update((s) => ({
      ...s,
      settings: { ...s.settings, notify: { ...s.settings.notify, ...patch } },
    })),
  setWarnDays: (n) =>
    update((s) => ({ ...s, settings: { ...s.settings, warnDays: n } })),

  addPermit: (i) => {
    const id = `pm-${uid()}`;
    act(
      (s) => ({
        ...s,
        permits: [
          {
            ...i,
            id,
            status: "Requested",
            approver: "",
            checks: PERMIT_CHECKS[i.kind].map((text, n) => ({
              id: `c${n}`,
              text,
              done: false,
            })),
          },
          ...s.permits,
        ],
      }),
      ev(
        "Permits",
        i.projectId,
        `requested a ${i.kind.toLowerCase()} permit: ${i.title}`,
        "No permit",
        "Requested",
      ),
    );
    return id;
  },
  toggleCheck: (id, checkId) =>
    update((s) => ({
      ...s,
      permits: patchIn(s.permits, id, (x) => ({
        ...x,
        checks: x.checks.map((c) =>
          c.id === checkId ? { ...c, done: !c.done } : c,
        ),
      })),
    })),
  setPermitStatus: (id, status) => {
    const x = current().permits.find((p) => p.id === id);
    act(
      (s) => ({
        ...s,
        permits: patchIn(s.permits, id, (p) => ({
          ...p,
          status,
          approver: status === "Approved" ? me.name : p.approver,
        })),
      }),
      ev(
        "Permits",
        x?.projectId ?? ALL,
        `${status === "Approved" ? "approved" : status === "Closed" ? "closed out" : status === "Cancelled" ? "cancelled" : "updated"} the permit ${x?.title ?? ""}`.trim(),
        x?.status ?? "",
        status,
      ),
    );
  },

  addPlant: (i) =>
    act(
      (s) => ({
        ...s,
        plant: [
          {
            ...i,
            id: `pl-${uid()}`,
            lastService: todayISO(),
            lastPrestart: null,
            status: "In service",
            defect: "",
          },
          ...s.plant,
        ],
      }),
      ev(
        "Plant",
        i.projectId,
        `added ${i.name} to the plant register`,
        "Not registered",
        "In service",
      ),
    ),
  logPrestart: (id) => {
    const x = current().plant.find((p) => p.id === id);
    if (x && plantApproval(x) !== "Approved") return;
    act(
      (s) => ({
        ...s,
        plant: patchIn(s.plant, id, (p) => ({
          ...p,
          lastPrestart: todayISO(),
        })),
      }),
      ev(
        "Plant",
        x?.projectId ?? ALL,
        `completed the pre-start for ${x?.name ?? "plant"}`,
        "Not checked",
        "Checked",
      ),
    );
  },
  submitPlant: (i) => {
    const s0 = current();
    const id = `pl-${uid()}`;
    const sub = s0.subs.find((x) => x.id === i.ownerId);
    const owner = i.ownerId === "own" || !sub ? "Owned" : sub.name;
    const acct = s0.settings.account;
    const by =
      acct === "subcontractor" && sub ? sub.contact || sub.name : me.name;
    const t = plantTypeByKey(i.typeKey);
    act(
      (s) => ({
        ...s,
        plant: [
          {
            id,
            projectId: i.projectId,
            name: i.name,
            kind: t?.label ?? i.typeKey,
            typeKey: i.typeKey,
            serial: i.serial,
            owner,
            ownerId: i.ownerId,
            capacityT: i.capacityT,
            flags: i.flags,
            operatorMode: i.operatorMode,
            meter: i.meter ? { ...i.meter, readAt: todayISO() } : undefined,
            serviceReading: i.serviceReading ?? undefined,
            maintenance: i.maintenance,
            photo: i.photo,
            lastService: i.lastService,
            nextService: i.nextService,
            tagDue: i.tagDue,
            lastPrestart: null,
            status: "Off site" as const,
            defect: "",
            onboarding: {
              status: "Submitted" as const,
              ownerId: i.ownerId,
              submittedAt: stamp(),
              submittedBy: by,
              operator: OPERATOR_LABEL[i.operatorMode],
              onSiteFrom: i.onSiteFrom,
              docs: i.docs.map(
                (d, n): PlantDoc => ({
                  id: `d${n + 1}`,
                  key: d.key,
                  kind: d.kind,
                  expires: d.expires,
                  files: d.files,
                  verified: false,
                }),
              ),
              inspection: newPlantChecks(i.typeKey),
            },
          },
          ...s.plant,
        ],
      }),
      ev(
        "Plant",
        i.projectId,
        `put ${i.name} forward for ${projectName(s0, i.projectId)}`,
        "Not on site",
        "Submitted",
      ),
    );
    return id;
  },
  resubmitPlant: (id, i) => {
    const s0 = current();
    const x = s0.plant.find((p) => p.id === id);
    if (!x?.onboarding) return;
    const t = plantTypeByKey(i.typeKey);
    act(
      (s) => ({
        ...s,
        plant: patchIn(s.plant, id, (p) => ({
          ...p,
          projectId: i.projectId,
          name: i.name,
          kind: t?.label ?? i.typeKey,
          typeKey: i.typeKey,
          serial: i.serial,
          capacityT: i.capacityT,
          flags: i.flags,
          operatorMode: i.operatorMode,
          meter: i.meter ? { ...i.meter, readAt: todayISO() } : undefined,
          serviceReading: i.serviceReading ?? undefined,
          maintenance: i.maintenance,
          photo: i.photo,
          lastService: i.lastService,
          nextService: i.nextService,
          tagDue: i.tagDue,
          status: "Off site" as const,
          onboarding: {
            ...p.onboarding!,
            status: "Submitted" as const,
            submittedAt: stamp(),
            operator: OPERATOR_LABEL[i.operatorMode],
            onSiteFrom: i.onSiteFrom,
            docs: i.docs.map(
              (d, n): PlantDoc => ({
                id: `d${n + 1}`,
                key: d.key,
                kind: d.kind,
                expires: d.expires,
                files: d.files,
                verified: false,
              }),
            ),
            inspection: newPlantChecks(i.typeKey),
            inspectedBy: undefined,
            inspectedAt: undefined,
            decidedAt: undefined,
            decidedBy: undefined,
            note: undefined,
            conditions: undefined,
          },
        })),
      }),
      ev(
        "Plant",
        i.projectId,
        `resubmitted ${i.name} for ${projectName(s0, i.projectId)}`,
        "Declined",
        "Submitted",
      ),
    );
  },
  withdrawPlant: (id) => {
    const x = current().plant.find((p) => p.id === id);
    if (!x?.onboarding || x.onboarding.status !== "Submitted") return;
    act(
      (s) => ({
        ...s,
        plant: patchIn(s.plant, id, (p) => ({
          ...p,
          onboarding: { ...p.onboarding!, status: "Withdrawn" as const },
        })),
      }),
      ev("Plant", x.projectId, `withdrew ${x.name}`, "Submitted", "Withdrawn"),
    );
  },
  verifyPlantDoc: (id, docId, verified) =>
    update((s) => ({
      ...s,
      plant: patchIn(s.plant, id, (p) =>
        p.onboarding
          ? {
              ...p,
              onboarding: {
                ...p.onboarding,
                // a document with no file cannot be verified
                docs: p.onboarding.docs.map((d) =>
                  d.id === docId && (!verified || d.files?.length)
                    ? { ...d, verified }
                    : d,
                ),
              },
            }
          : p,
      ),
    })),
  setPlantCheck: (id, checkId, result, note) =>
    update((s) => ({
      ...s,
      plant: patchIn(s.plant, id, (p) =>
        p.onboarding
          ? {
              ...p,
              onboarding: {
                ...p.onboarding,
                inspection: p.onboarding.inspection.map((c) =>
                  c.id === checkId
                    ? { ...c, result, note: note ?? c.note }
                    : c,
                ),
                inspectedBy: me.name,
                inspectedAt: stamp(),
              },
            }
          : p,
      ),
    })),
  decidePlant: (id, decision, note) => {
    const s0 = current();
    const x = s0.plant.find((p) => p.id === id);
    if (!x?.onboarding || x.onboarding.status !== "Submitted") return;
    if (
      decision === "Approved" &&
      plantBlockers(x.onboarding, {
        photo: !!x.photo?.length,
        pl: contractorPl(s0.subs.find((c) => c.id === x.ownerId)),
      }).length
    )
      return;
    act(
      (s) => ({
        ...s,
        plant: patchIn(s.plant, id, (p) => ({
          ...p,
          status: decision === "Approved" ? ("In service" as const) : ("Off site" as const),
          onboarding: {
            ...p.onboarding!,
            status: decision,
            decidedAt: stamp(),
            decidedBy: me.name,
            conditions:
              decision === "Approved" ? note?.trim() || undefined : undefined,
            note: decision === "Declined" ? note?.trim() || undefined : undefined,
          },
        })),
      }),
      ev(
        "Plant",
        x.projectId,
        `${decision === "Approved" ? "approved" : "declined"} ${x.name} for ${projectName(s0, x.projectId)}`,
        "Submitted",
        decision,
      ),
    );
  },
  logService: (id, nextService) => {
    const x = current().plant.find((p) => p.id === id);
    act(
      (s) => ({
        ...s,
        plant: patchIn(s.plant, id, (p) => ({
          ...p,
          lastService: todayISO(),
          nextService,
        })),
      }),
      ev(
        "Plant",
        x?.projectId ?? ALL,
        `recorded a service for ${x?.name ?? "plant"}`,
        x?.lastService ?? "",
        todayISO(),
      ),
    );
  },
  setPlantStatus: (id, status, defect) => {
    const x = current().plant.find((p) => p.id === id);
    act(
      (s) => ({
        ...s,
        plant: patchIn(s.plant, id, (p) => ({
          ...p,
          status,
          defect: status === "Out of service" ? (defect ?? p.defect) : "",
        })),
      }),
      ev(
        "Plant",
        x?.projectId ?? ALL,
        `moved ${x?.name ?? "plant"} to ${status.toLowerCase()}`,
        x?.status ?? "",
        status,
      ),
    );
  },
  tagPlant: (id, nextDue) => {
    const x = current().plant.find((p) => p.id === id);
    act(
      (s) => ({
        ...s,
        plant: patchIn(s.plant, id, (p) => ({ ...p, tagDue: nextDue })),
      }),
      ev(
        "Plant",
        x?.projectId ?? ALL,
        `recorded test and tag for ${x?.name ?? "plant"}`,
        x?.tagDue ?? "Not tagged",
        nextDue,
      ),
    );
  },

  startSiteOnboarding: (subId, projectId) => {
    const existing = current().siteOnboardings.find(
      (o) => o.subId === subId && o.projectId === projectId,
    );
    if (existing) return existing.id;
    const id = `so-${uid()}`;
    update((s) => ({
      ...s,
      siteOnboardings: [
        newSiteOnboarding(id, subId, projectId, stamp()),
        ...s.siteOnboardings,
      ],
    }));
    return id;
  },
  saveSiteOnboarding: (id, patch) =>
    update((s) => ({
      ...s,
      siteOnboardings: s.siteOnboardings.map((o) =>
        o.id === id && (o.status === "Draft" || o.status === "Declined")
          ? { ...o, ...patch }
          : o,
      ),
    })),
  submitSiteOnboarding: (id) => {
    const s0 = current();
    const o = s0.siteOnboardings.find((x) => x.id === id);
    if (!o || (o.status !== "Draft" && o.status !== "Declined")) return;
    if (siteOnboardingProblems(o).length) return;
    const sub = s0.subs.find((x) => x.id === o.subId);
    act(
      (s) => ({
        ...s,
        siteOnboardings: s.siteOnboardings.map((x) =>
          x.id === id
            ? {
                ...x,
                status: "Submitted" as const,
                submittedAt: stamp(),
                submittedBy: sub?.contact || sub?.name || "Subcontractor",
                decidedAt: undefined,
                decidedBy: undefined,
                note: undefined,
                // a fresh review each time it is sent
                swms: x.swms.map((i) => ({ ...i, verified: false })),
                chemicals: x.chemicals.map((i) => ({ ...i, verified: false })),
              }
            : x,
        ),
      }),
      ev(
        "Chemicals",
        o.projectId,
        `submitted its SWMS and SDS for ${projectName(s0, o.projectId)}`,
        o.status,
        "Submitted",
      ),
    );
  },
  verifySiteItem: (id, list, itemId, verified) =>
    update((s) => ({
      ...s,
      siteOnboardings: s.siteOnboardings.map((o) =>
        o.id === id && o.status === "Submitted"
          ? {
              ...o,
              [list]: (o[list] as { id: string; verified: boolean }[]).map(
                (i) => (i.id === itemId ? { ...i, verified } : i),
              ),
            }
          : o,
      ),
    })),
  decideSiteOnboarding: (id, decision, note) => {
    const s0 = current();
    const o = s0.siteOnboardings.find((x) => x.id === id);
    if (!o || o.status !== "Submitted") return;
    if (decision === "Approved" && siteOnboardingBlockers(o).length) return;
    const sub = s0.subs.find((x) => x.id === o.subId);
    act(
      (s) => ({
        ...s,
        siteOnboardings: s.siteOnboardings.map((x) =>
          x.id === id
            ? {
                ...x,
                status: decision,
                decidedAt: stamp(),
                decidedBy: me.name,
                note: decision === "Declined" ? note?.trim() || undefined : undefined,
              }
            : x,
        ),
        // approved chemicals go onto the builder's register for this project
        chemicals:
          decision === "Approved"
            ? [
                ...o.chemicals.map((c) => ({
                  id: `ch-${uid()}`,
                  projectId: o.projectId,
                  name: c.name,
                  supplier: c.supplier,
                  hazard: c.hazard,
                  quantity: c.quantity,
                  location: c.location,
                  hasSds: true,
                  sdsDate: c.sdsDate,
                  controls: `Brought by ${sub?.name ?? "a subcontractor"}. Follow the safety data sheet and the subcontractor's SWMS.`,
                  status: "In use" as const,
                  files: c.files,
                  ownerId: o.subId,
                })),
                ...s.chemicals,
              ]
            : s.chemicals,
      }),
      ev(
        "Chemicals",
        o.projectId,
        `${decision === "Approved" ? "approved" : "declined"} ${sub?.name ?? "the subcontractor"}'s site onboarding for ${projectName(s0, o.projectId)}`,
        "Submitted",
        decision,
      ),
    );
  },
  addChemical: (i) =>
    act(
      (s) => ({
        ...s,
        chemicals: [
          { ...i, id: `ch-${uid()}`, status: "In use" },
          ...s.chemicals,
        ],
      }),
      ev(
        "Chemicals",
        i.projectId,
        `added ${i.name} to the chemicals register`,
        "Not registered",
        i.hasSds ? "SDS on file" : "SDS missing",
      ),
    ),
  updateChemical: (id, patch) => {
    const x = current().chemicals.find((c) => c.id === id);
    act(
      (s) => ({
        ...s,
        chemicals: patchIn(s.chemicals, id, (c) => ({ ...c, ...patch })),
      }),
      ev(
        "Chemicals",
        x?.projectId ?? ALL,
        `updated ${x?.name ?? "a chemical"}`,
        patch.status ? (x?.status ?? "") : "Previous",
        patch.status ?? (patch.hasSds ? "SDS on file" : "Updated"),
      ),
    );
  },

  addDrill: (i) =>
    act(
      (s) => ({ ...s, drills: [{ ...i, id: `dr-${uid()}` }, ...s.drills] }),
      ev(
        "Emergency",
        i.projectId,
        `recorded an ${i.kind.toLowerCase()}`,
        "Not recorded",
        i.date,
      ),
    ),
  updateEmergency: (projectId, patch) =>
    act(
      (s) => ({
        ...s,
        projects: patchIn(s.projects, projectId, (p) => ({ ...p, ...patch })),
      }),
      ev(
        "Emergency",
        projectId,
        "updated the emergency details",
        "Previous",
        "Updated",
      ),
    ),
  setHours: (projectId, hours) =>
    update((s) => ({
      ...s,
      projects: patchIn(s.projects, projectId, (p) => ({ ...p, hours })),
    })),

  signInVisitor: (i) => {
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    act(
      (s) => ({
        ...s,
        visitors: [
          {
            ...i,
            id: `v-${uid()}`,
            inAt: `${todayISO()} ${hhmm}`,
            outAt: null,
          },
          ...s.visitors,
        ],
      }),
      ev(
        "Visitors",
        i.projectId,
        `signed in the visitor ${i.name}`,
        "Off site",
        "On site",
      ),
    );
  },
  signOutVisitor: (id) => {
    const x = current().visitors.find((v) => v.id === id);
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    act(
      (s) => ({
        ...s,
        visitors: patchIn(s.visitors, id, (v) => ({
          ...v,
          outAt: `${todayISO()} ${hhmm}`,
        })),
      }),
      ev(
        "Visitors",
        x?.projectId ?? ALL,
        `signed out the visitor ${x?.name ?? ""}`.trim(),
        "On site",
        "Off site",
      ),
    );
  },

  add: (k, rec, e) => {
    const id = `${k.slice(0, 2)}-${uid()}`;
    act(
      (s) => ({
        ...s,
        [k]: [{ ...rec, id }, ...(s[k] as { id: string }[])],
      }),
      ev(e.area, e.projectId, e.act, e.from ?? "Not on record", e.to),
    );
    return id;
  },
  patch: (k, id, p, e) => {
    const apply = (s: Saved) => ({
      ...s,
      [k]: patchIn(s[k] as { id: string }[], id, (x) => ({ ...x, ...p })),
    });
    if (e)
      act(apply, ev(e.area, e.projectId, e.act, e.from ?? "Previous", e.to));
    else update(apply);
  },
  remove: (k, id, e) => {
    const apply = (s: Saved) => ({
      ...s,
      [k]: (s[k] as { id: string }[]).filter((x) => x.id !== id),
    });
    if (e)
      act(apply, ev(e.area, e.projectId, e.act, e.from ?? "On record", e.to));
    else update(apply);
  },
  recordInduction: (i) => {
    const s0 = current();
    act(
      (s) => ({
        ...s,
        inductions: [
          { ...i, id: `ind-${uid()}`, date: todayISO() },
          ...s.inductions,
        ],
        workers: patchIn(s.workers, i.workerId, (w) =>
          w.inducted.includes(i.projectId)
            ? w
            : { ...w, inducted: [...w.inducted, i.projectId] },
        ),
      }),
      ev(
        "Inductions",
        i.projectId,
        `inducted ${workerName(s0, i.workerId)} to ${projectName(s0, i.projectId)}`,
        "Not inducted",
        `Signed as ${i.signedAs}`,
      ),
    );
  },
  setPrequal: (sid, itemId, done) =>
    update((s) => ({
      ...s,
      subs: patchIn(s.subs, sid, (x) => {
        const list =
          x.prequal ??
          PREQUAL_ITEMS.map((text, n) => ({
            id: `q${n}`,
            text,
            done: x.approved,
          }));
        return {
          ...x,
          prequal: list.map((q) => (q.id === itemId ? { ...q, done } : q)),
        };
      }),
    })),
  setItemFiles: (id, itemId, files) =>
    update((s) => ({
      ...s,
      inspections: patchIn(s.inspections, id, (x) => ({
        ...x,
        items: x.items.map((i) => (i.id === itemId ? { ...i, files } : i)),
      })),
    })),
  setDocFiles: (sid, did, files) =>
    update((s) => ({
      ...s,
      subs: patchIn(s.subs, sid, (x) => ({
        ...x,
        docs: x.docs.map((d) => (d.id === did ? { ...d, files } : d)),
      })),
    })),
  updateDocument: (id, patch) =>
    update((s) => ({
      ...s,
      docs: patchIn(s.docs, id, (d) => ({ ...d, ...patch })),
    })),
  addTemplate: (name, items) =>
    act(
      (s) => ({
        ...s,
        customTemplates: [
          ...s.customTemplates,
          { id: `ct-${uid()}`, name, items },
        ],
      }),
      ev(
        "Inspections",
        ALL,
        `saved the checklist ${name}`,
        "Not saved",
        `${items.length} items`,
      ),
    ),
  removeTemplate: (id) =>
    update((s) => ({
      ...s,
      customTemplates: s.customTemplates.filter((t) => t.id !== id),
    })),
  addDocument: (i) =>
    act(
      (s) => ({
        ...s,
        docs: [
          { ...i, id: `dc-${uid()}`, updated: todayISO(), signed: [] },
          ...s.docs,
        ],
      }),
      ev(
        "Documents",
        i.projectId,
        `added the ${i.category.toLowerCase()} ${i.title}`,
        "Not on file",
        `v${i.version}`,
      ),
    ),
  signDoc: (id, workerId) => {
    const s0 = current();
    const d = s0.docs.find((x) => x.id === id);
    act(
      (s) => ({
        ...s,
        docs: patchIn(s.docs, id, (x) =>
          x.signed.includes(workerId)
            ? x
            : { ...x, signed: [...x.signed, workerId] },
        ),
      }),
      ev(
        "Documents",
        d?.projectId ?? ALL,
        `recorded ${workerName(s0, workerId)} reading ${d?.title ?? "a document"}`,
        "Unsigned",
        `Signed v${d?.version ?? ""}`,
      ),
    );
  },
  reviewDoc: (id, version, reviewDue) => {
    const d = current().docs.find((x) => x.id === id);
    act(
      (s) => ({
        ...s,
        docs: patchIn(s.docs, id, (x) => ({
          ...x,
          version,
          reviewDue,
          updated: todayISO(),
          signed: [],
        })),
      }),
      ev(
        "Documents",
        d?.projectId ?? ALL,
        `issued version ${version} of ${d?.title ?? "a document"}`,
        `v${d?.version ?? ""}`,
        `v${version}`,
      ),
    );
  },

  setPlan: (plan) => {
    const from = current().settings.plan ?? "Medium";
    act(
      (s) => ({ ...s, settings: { ...s.settings, plan } }),
      ev("Settings", ALL, `changed the plan to ${plan} (A$${PLANS[plan].price} a month + GST)`, from, plan),
    );
  },
  upgradePlan: (p) => {
    const charge = p.total >= MIN_CHARGE;
    act(
      (s) => {
        const invoices = s.settings.invoices ?? SEED_INVOICES;
        const invoice = charge
          ? makeInvoice(
              nextInvoiceId(invoices, new Date().getFullYear()),
              todayISO(),
              `Plan change, ${p.from} to ${p.to}`,
              prorationLines(p),
            )
          : null;
        const next = { ...s.settings, plan: p.to, invoices: invoice ? [invoice, ...invoices] : invoices };
        delete next.pendingPlan;
        return { ...s, settings: next };
      },
      ev(
        "Settings",
        ALL,
        charge
          ? `upgraded to ${p.to} and paid A$${p.total.toFixed(2)} for the rest of the month`
          : `upgraded to ${p.to}`,
        p.from,
        p.to,
      ),
    );
  },
  scheduleDowngrade: (plan, on) =>
    act(
      (s) => ({ ...s, settings: { ...s.settings, pendingPlan: { plan, on } } }),
      ev("Settings", ALL, `booked a move to ${plan} from ${on}`, current().settings.plan ?? "", `${plan} from ${on}`),
    ),
  cancelPlanChange: () => {
    const pending = current().settings.pendingPlan;
    if (!pending) return;
    act(
      (s) => {
        const next = { ...s.settings };
        delete next.pendingPlan;
        return { ...s, settings: next };
      },
      ev("Settings", ALL, `cancelled the move to ${pending.plan}`, pending.plan, current().settings.plan ?? ""),
    );
  },
  applyDuePlanChange: (today) => {
    const pending = current().settings.pendingPlan;
    if (!pending || pending.on > today) return;
    act(
      (s) => {
        const next = { ...s.settings, plan: pending.plan };
        delete next.pendingPlan;
        return { ...s, settings: next };
      },
      ev("Settings", ALL, `moved to ${pending.plan} at the start of the billing period`, current().settings.plan ?? "", pending.plan),
    );
  },
  updateCard: (card) =>
    act(
      (s) => ({ ...s, settings: { ...s.settings, card } }),
      ev("Settings", ALL, `updated the card on file to ${card.brand} ending ${card.last4}`, "", ""),
    ),
  setIsoProfile: (patch) =>
    update((s) => ({
      ...s,
      iso: { ...s.iso, profile: { ...s.iso.profile, ...patch } },
    })),
  saveIsoDoc: (key, doc, note) => {
    const write = (s: Saved): Saved => ({
      ...s,
      iso: { ...s.iso, docs: { ...s.iso.docs, [key]: doc } },
    });
    if (note)
      act(write, ev("Documents", ALL, note, "", doc.status));
    else update(write);
  },
  buyIso: (std, card) => {
    const receipt = `ISO-${std}-${uid().slice(0, 6).toUpperCase()}`;
    act(
      (s) => ({
        ...s,
        iso: {
          ...s.iso,
          purchases: {
            ...s.iso.purchases,
            [std]: {
              paidAt: todayISO(),
              amount: ISO_PRICE,
              receipt,
              brand: card.brand,
              last4: card.last4,
            },
          },
        },
      }),
      ev(
        "Documents",
        ALL,
        `bought the ISO ${std} document set from ISO Vault (${money(ISO_PRICE)})`,
        "Locked",
        "Unlocked",
      ),
    );
    return receipt;
  },
  removeIsoDoc: (key) =>
    update((s) => {
      const docs = { ...s.iso.docs };
      delete docs[key];
      return { ...s, iso: { ...s.iso, docs } };
    }),
  respondInvite: (id, accept) => {
    const s0 = current();
    const inv = s0.invites.find((i) => i.id === id);
    if (!inv) return;
    act(
      (s) => ({
        ...s,
        invites: s.invites.map((i) =>
          i.id === id ? { ...i, status: accept ? "Accepted" : "Declined" } : i,
        ),
        subs: accept
          ? patchIn(s.subs, inv.subId, (x) =>
              x.projects.includes(inv.projectId)
                ? x
                : { ...x, projects: [...x.projects, inv.projectId] },
            )
          : s.subs,
        // being allocated to a project starts its SWMS and SDS onboarding
        siteOnboardings:
          accept &&
          !s.siteOnboardings.some(
            (o) => o.subId === inv.subId && o.projectId === inv.projectId,
          )
            ? [
                newSiteOnboarding(
                  `so-${uid()}`,
                  inv.subId,
                  inv.projectId,
                  stamp(),
                ),
                ...s.siteOnboardings,
              ]
            : s.siteOnboardings,
      }),
      ev(
        "People",
        inv.projectId,
        `${accept ? "accepted" : "declined"} the invitation to ${projectName(s0, inv.projectId)}`,
        "Invited",
        accept ? "On the project" : "Declined",
      ),
    );
  },
  cancelInvite: (id) => {
    const s0 = current();
    const inv = s0.invites.find((i) => i.id === id);
    if (!inv || inv.status !== "Pending") return;
    const who = s0.subs.find((x) => x.id === inv.subId)?.name ?? "A subcontractor";
    act(
      (s) => ({
        ...s,
        invites: s.invites.map((i) =>
          i.id === id ? { ...i, status: "Cancelled" } : i,
        ),
      }),
      ev(
        "People",
        inv.projectId,
        `cancelled the invitation for ${who} to ${projectName(s0, inv.projectId)}`,
        "Invited",
        "Cancelled",
      ),
    );
  },
  removeSubFromProject: (subId, projectId) => {
    const s0 = current();
    const sub = s0.subs.find((x) => x.id === subId);
    if (!sub) return;
    act(
      (s) => detachSub(s, subId, projectId, "Removed"),
      ev(
        "People",
        projectId,
        `removed ${sub.name} from ${projectName(s0, projectId)}`,
        "On the project",
        "Removed",
      ),
    );
  },
  requestFinish: (subId, projectId) => {
    const s0 = current();
    const sub = s0.subs.find((x) => x.id === subId);
    if (!sub) return;
    act(
      (s) => {
        const has = s.invites.some(
          (i) =>
            i.subId === subId &&
            i.projectId === projectId &&
            i.status === "Accepted",
        );
        return {
          ...s,
          invites: has
            ? s.invites.map((i) =>
                i.subId === subId &&
                i.projectId === projectId &&
                i.status === "Accepted"
                  ? { ...i, finishRequested: todayISO() }
                  : i,
              )
            : [
                {
                  id: `inv-${uid()}`,
                  subId,
                  projectId,
                  from: s.settings.company.name,
                  by: me.name,
                  date: todayISO(),
                  status: "Accepted" as const,
                  finishRequested: todayISO(),
                },
                ...s.invites,
              ],
        };
      },
      ev(
        "People",
        projectId,
        `said its work on ${projectName(s0, projectId)} is complete`,
        "On the project",
        "Completion requested",
      ),
    );
  },
  finishSubOnProject: (subId, projectId) => {
    const s0 = current();
    const sub = s0.subs.find((x) => x.id === subId);
    if (!sub) return;
    act(
      (s) => detachSub(s, subId, projectId, "Finished"),
      ev(
        "People",
        projectId,
        `confirmed ${sub.name} finished on ${projectName(s0, projectId)}`,
        "On the project",
        "Finished",
      ),
    );
  },
  closeProject: (id, note) => {
    const s0 = current();
    const name = projectName(s0, id);
    act(
      (s) => {
        let n = s;
        for (const x of s.subs.filter((y) => y.projects.includes(id)))
          n = detachSub(n, x.id, id, "Finished");
        return {
          ...n,
          invites: n.invites.map((i) =>
            i.projectId === id && i.status === "Pending"
              ? { ...i, status: "Cancelled" }
              : i,
          ),
          projects: patchIn(n.projects, id, (p) => ({
            ...p,
            status: "Complete",
            closedAt: todayISO(),
            closeNote: note?.trim() || undefined,
            onSite: [],
          })),
        };
      },
      ev("Projects", id, `closed and stored ${name}`, "Live", "Complete"),
    );
  },
  reopenProject: (id) => {
    const name = projectName(current(), id);
    act(
      (s) => ({
        ...s,
        projects: patchIn(s.projects, id, (p) => ({
          ...p,
          status: "Live",
          closedAt: undefined,
          closeNote: undefined,
        })),
      }),
      ev("Projects", id, `reopened ${name}`, "Complete", "Live"),
    );
  },
  inviteSub: (subId, projectId) => {
    const s0 = current();
    if (
      s0.invites.some(
        (i) =>
          i.subId === subId && i.projectId === projectId && i.status === "Pending",
      )
    )
      return;
    const who = s0.subs.find((x) => x.id === subId)?.name ?? "A subcontractor";
    act(
      (s) => ({
        ...s,
        invites: [
          {
            id: `inv-${uid()}`,
            subId,
            projectId,
            from: s.settings.company.name,
            by: me.name,
            date: todayISO(),
            status: "Pending",
          },
          ...s.invites,
        ],
      }),
      ev(
        "People",
        projectId,
        `invited ${who} to ${projectName(s0, projectId)}`,
        "Not on the project",
        "Invited",
      ),
    );
  },
  updateSub: (id, patch) =>
    update((s) => ({ ...s, subs: patchIn(s.subs, id, (x) => ({ ...x, ...patch })) })),

  resetDemo: () => {
    clearFiles().catch(() => {});
    writeSaved(SEED);
  },
};

/** Called when someone signs up: builders put their company into the workspace, subcontractors join the builder that added them or get a record of their own. */
export function startWorkspace(input: {
  company: string;
  abn: string;
  email: string;
  contact: string;
  account: "builder" | "subcontractor";
  plan?: string;
  trialEnds?: string;
  card?: NonNullable<Settings["card"]>;
}) {
  update((s) => {
    if (input.account === "subcontractor") {
      const email = input.email.trim().toLowerCase();
      // A builder may already have added this business with this email and invited it to projects.
      const existing = s.subs.find(
        (x) => !x.claimed && x.email?.toLowerCase() === email,
      );
      if (existing) {
        const joined = {
          ...ev(
            "People",
            ALL,
            `${existing.name} signed up and can now accept their invitations`,
            "Not signed up",
            "Joined",
          ),
          name: `${input.contact} (${existing.name})`,
        };
        return {
          ...s,
          subs: patchIn(s.subs, existing.id, (x) => ({
            ...x,
            claimed: true,
            contact: input.contact || x.contact,
          })),
          audit: [joined, ...s.audit],
          settings: { ...s.settings, account: "subcontractor", subId: existing.id },
        };
      }
      const id = `s-${uid()}`;
      const live = s.projects.filter((p) => p.status === "Live").slice(0, 2);
      return {
        ...s,
        subs: [
          ...s.subs,
          {
            id,
            name: input.company,
            trade: "",
            contact: input.contact,
            phone: "",
            email,
            claimed: true,
            projects: [],
            approved: false,
            docs: [],
          },
        ],
        // Nobody has invited this business yet. The demo gives it two invitations so the portal has something to show.
        invites: [
          ...live.map((p) => ({
            id: `inv-${uid()}`,
            subId: id,
            projectId: p.id,
            from: s.settings.company.name,
            by: p.manager,
            date: todayISO(),
            status: "Pending" as const,
          })),
          ...s.invites,
        ],
        settings: { ...s.settings, account: "subcontractor", subId: id },
      };
    }
    return {
      ...s,
      settings: {
        ...s.settings,
        company: {
          ...s.settings.company,
          name: input.company,
          abn: input.abn,
          email: input.email,
        },
        account: "builder",
        plan: input.plan as BuilderPlan | undefined,
        trialEnds: input.trialEnds,
        card: input.card,
        invoices: [],
        pendingPlan: undefined,
      },
    };
  });
}

/** Sign in as a builder or a subcontractor. A subcontractor email that a builder added opens that business. Otherwise the demo shows Apex Scaffolding. */
export function signInAs(account: "builder" | "subcontractor", email = "") {
  update((s) => {
    const m =
      account === "subcontractor" && email
        ? s.subs.find((x) => x.email?.toLowerCase() === email.trim().toLowerCase())
        : undefined;
    return {
      ...s,
      subs: m ? patchIn(s.subs, m.id, (x) => ({ ...x, claimed: true })) : s.subs,
      settings: {
        ...s.settings,
        account,
        subId: m?.id ?? s.settings.subId ?? "s-apex",
      },
    };
  });
}

/** Open a worker's own profile, where they sign what has been sent to them. The demo has no real logins. */
export function signInAsWorker(workerId: string) {
  update((s) => ({
    ...s,
    settings: { ...s.settings, account: "worker", workerId },
  }));
}

const Ctx = createContext<Store | null>(null);

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const saved = useSyncExternalStore(subscribe, readSaved, () => null);
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const state = saved ?? SEED;

  // A downgrade booked for the next billing date takes effect once that date arrives.
  useEffect(() => {
    if (ready) actions.applyDuePlanChange(todayISO());
  }, [ready]);

  const value = useMemo<Store>(
    () => ({ ...state, ready, ...actions }),
    [ready, state],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used inside DemoStoreProvider");
  return v;
}

/**
 * Everything in the store, narrowed to the project picked in the top bar.
 * Workers and subcontractors belong to a project when they are assigned to it.
 */
export function useScope() {
  const s = useStore();
  return useMemo(() => {
    const all =
      s.projectId === ALL || !s.projects.some((p) => p.id === s.projectId);
    const id = all ? ALL : s.projectId;
    const inP = <T extends { projectId: string }>(l: T[]) =>
      all ? l : l.filter((x) => x.projectId === id);
    const inA = <T extends { projects: string[] }>(l: T[]) =>
      all ? l : l.filter((x) => x.projects.includes(id));
    return {
      ...s,
      all,
      scopeId: id,
      project: all ? undefined : s.projects.find((p) => p.id === id),
      scopeLabel: all
        ? "All projects"
        : (s.projects.find((p) => p.id === id)?.name ?? "All projects"),
      projectsIn: all ? s.projects : s.projects.filter((p) => p.id === id),
      swmsIn: inP(s.swms),
      risksIn: inP(s.risks),
      talksIn: inP(s.talks),
      permitsIn: inP(s.permits),
      diariesIn: inP(s.diaries),
      inductionsIn: inP(s.inductions),
      defectsIn: inP(s.defects),
      rfisIn: inP(s.rfis),
      tasksIn: inP(s.tasks),
      drawingsIn: inP(s.drawings),
      schedulesIn: inP(s.schedules),
      noticesIn: all
        ? s.notices
        : s.notices.filter((x) => x.projectId === id || x.projectId === ALL),
      plantIn: inP(s.plant),
      chemicalsIn: inP(s.chemicals),
      drillsIn: inP(s.drills),
      visitorsIn: inP(s.visitors),
      docsIn: all
        ? s.docs
        : s.docs.filter((x) => x.projectId === id || x.projectId === ALL),
      inspectionsIn: inP(s.inspections),
      incidentsIn: inP(s.incidents),
      actionsIn: inP(s.actions),
      auditIn: all
        ? s.audit
        : s.audit.filter((x) => x.projectId === id || x.projectId === ALL),
      workersIn: inA(s.workers),
      subsIn: all
        ? s.subs
        : s.subs.filter(
            (x) =>
              x.projects.includes(id) ||
              s.invites.some(
                (i) =>
                  i.subId === x.id &&
                  i.projectId === id &&
                  i.status === "Pending",
              ),
          ),
    };
  }, [s]);
}

export { INCIDENT_FLOW, initialsOf };
