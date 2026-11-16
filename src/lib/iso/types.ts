export type IsoStd = "9001" | "45001" | "14001";

export type DocKind =
  | "Manual"
  | "Policy"
  | "Procedure"
  | "Plan"
  | "Register"
  | "Form";

export type IsoDocSpec = {
  /** unique within a standard */
  id: string;
  std: IsoStd;
  title: string;
  kind: DocKind;
  /** clauses this document answers */
  clauses: string[];
  /** documented information the standard requires, as against what auditors expect to see */
  mandatory: boolean;
  purpose: string;
  /** the content of the procedure, policy commitments or plan, one full statement each */
  steps: string[];
  roles: [role: string, responsibility: string][];
  /** records produced, with where they live */
  records: string[];
  kpis: [measure: string, target: string, frequency: string][];
  /** what a certification body auditor will ask to see */
  evidence: string[];
  /** columns of a register or form */
  columns?: string[];
  /** fill register rows from the business's own records */
  seed?: "risks" | "chemicals" | "plant" | "subs" | "incidents" | "projects" | "tickets";
  /** extra direction for the AI */
  guidance?: string;
};

export type Clause = {
  clause: string;
  title: string;
  /** the question an internal auditor asks */
  q: string;
};

export type StdMeta = {
  std: IsoStd;
  /** the standard as cited, for example ISO 9001:2015 */
  name: string;
  short: string;
  topic: string;
  system: string;
  prefix: string;
  blurb: string;
  clauses: Clause[];
  glossary: [term: string, meaning: string][];
};

/** What the person told us about the business. It drives every document. */
export type IsoProfile = {
  company: string;
  abn: string;
  address: string;
  state: string;
  /** the activities the management system covers */
  scope: string;
  staff: string;
  sites: string;
  buildingTypes: string[];
  subcontractUse: "Minimal" | "Moderate" | "Heavy";
  hazards: string;
  topManagement: string;
  topTitle: string;
  rep: string;
  existing: string;
  customers: string;
};

/** A compact snapshot of the business's own records, so documents mention real projects, risks and plant. */
export type IsoFacts = {
  projects: { name: string; stage: string; status: string; client: string }[];
  workers: number;
  subcontractors: { name: string; trade: string; approved: boolean }[];
  highRiskSwms: string[];
  risks: { hazard: string; category: string; controls: string; rating: string }[];
  chemicals: { name: string; hazard: string; location: string }[];
  plant: { name: string; kind: string }[];
  incidents: { title: string; type: string; severity: string; status: string }[];
  ticketKinds: string[];
};

export type IsoDocState = {
  status: "Draft" | "Approved";
  content: string;
  version: number;
  source: "AI" | "Template";
  generatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
};

export type IsoState = {
  profile: IsoProfile;
  docs: Record<string, IsoDocState>;
};

export const docKey = (std: IsoStd, id: string) => `${std}:${id}`;

export const EMPTY_FACTS: IsoFacts = {
  projects: [],
  workers: 0,
  subcontractors: [],
  highRiskSwms: [],
  risks: [],
  chemicals: [],
  plant: [],
  incidents: [],
  ticketKinds: [],
};
