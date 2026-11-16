import type { Project } from "./data";
import { PLANS, type PlanName } from "./billing";

/** Live projects count against a plan. Closed and archived projects never do. */
export const liveProjects = (projects: Project[]) =>
  projects.filter((p) => !p.closedAt && p.status !== "Complete");

/** Why a plan cannot hold the business as it stands, or null if it fits. */
export function planBlocker(plan: PlanName, projects: Project[]): string | null {
  const limit = PLANS[plan].limit;
  const n = liveProjects(projects).length;
  if (limit !== null && n > limit)
    return `${plan} allows up to ${limit} live projects and you have ${n}.`;
  return null;
}

export const gstOn = (price: number) => Math.round(price * 10) / 100;
