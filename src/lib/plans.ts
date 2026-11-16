/** Builder plans. Subcontractors are free: a builder onboards them from their own dashboard. */
export const BUILDER_PLANS = [
  {
    name: "Small",
    price: 149,
    projects: "Up to 3 live projects",
    limit: 3 as number | null,
    blurb: "For a builder with a few live sites.",
  },
  {
    name: "Medium",
    price: 349,
    projects: "Up to 10 live projects",
    limit: 10 as number | null,
    blurb: "For a builder running several projects at once.",
  },
  {
    name: "Large",
    price: 549,
    projects: "Unlimited live projects",
    limit: null as number | null,
    blurb: "For a multi-site builder with a safety team.",
  },
] as const;

export type BuilderPlan = (typeof BUILDER_PLANS)[number]["name"];
export const planPrice = (name: string) =>
  BUILDER_PLANS.find((p) => p.name === name)?.price ?? 0;
export const TRIAL_DAYS = 14;
