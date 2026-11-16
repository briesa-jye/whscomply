"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon, type IconName } from "./Icons";

type Plan = {
  name: string;
  icon: IconName;
  price: number;
  blurb: string;
  badge?: string;
  top: string[];
  lead: string;
  features: string[];
};

const plans: Plan[] = [
  {
    name: "Small",
    icon: "user",
    price: 149,
    blurb: "For a builder with a few live sites.",
    top: [
      "Up to 3 live projects",
      "Never charged per worker",
      "Subcontractors join free",
    ],
    lead: "What's included:",
    features: [
      "SWMS library and gate sign-on",
      "Incident and near miss reports",
      "Licence and white card alerts before expiry",
      "Toolbox talks with attendance",
      "Audit pack export",
    ],
  },
  {
    name: "Medium",
    icon: "store",
    price: 349,
    blurb: "For a builder running several projects at once.",
    badge: "Popular",
    top: [
      "Up to 10 live projects",
      "Never charged per worker",
      "Subcontractors join free",
    ],
    lead: "Everything in Small, plus:",
    features: [
      "Site inductions with sign-on and sign-off",
      "Inspections and corrective actions",
      "Subcontractor prequalification and approved lists",
      "Read-only access for inspectors and clients",
      "Priority support",
    ],
  },
  {
    name: "Large",
    icon: "building",
    price: 549,
    blurb: "For a multi-site builder with a safety team.",
    top: [
      "Unlimited live projects",
      "Never charged per worker",
      "Subcontractors join free",
    ],
    lead: "Everything in Medium, plus:",
    features: [
      "Company-wide compliance reporting",
      "Bulk import of workers and subcontractors",
      "Single sign-on",
      "Onboarding and migration help",
      "A named contact",
    ],
  },
];

const DEFAULT = "Medium";

export function PricingGrid() {
  const [active, setActive] = useState(DEFAULT);

  return (
    <>
    <div
      data-stagger
      className="mx-auto mt-14 grid max-w-6xl items-stretch gap-6 px-5 sm:px-8 md:grid-cols-3"
      onMouseLeave={() => setActive(DEFAULT)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setActive(DEFAULT);
      }}
    >
      {plans.map((p) => {
        const on = active === p.name;
        return (
          <article
            key={p.name}
            onMouseEnter={() => setActive(p.name)}
            onFocus={() => setActive(p.name)}
            className={`flex flex-col rounded-[2rem] border p-8 transition-all duration-300 ease-out ${
              on
                ? "z-10 border-ink bg-ink text-bg shadow-[0_30px_70px_-30px_oklch(0.23_0.02_255/0.6)] md:-translate-y-2 md:scale-[1.04]"
                : "border-line bg-surface"
            }`}
          >
            <div className="flex items-start justify-between">
              <span className={on ? "text-accent" : "text-ink"}>
                <Icon name={p.icon} className="h-9 w-9" />
              </span>
              {p.badge && (
                <span className="rounded-full bg-accent px-3 py-1 font-mono text-[0.65rem] font-medium uppercase tracking-widest text-ink">
                  {p.badge}
                </span>
              )}
            </div>

            <h2 className="mt-6 font-display text-3xl font-extrabold tracking-tight">
              {p.name}
            </h2>
            <p
              className={`mt-2 min-h-12 text-sm ${on ? "text-bg/75" : "text-ink-soft"}`}
            >
              {p.blurb}
            </p>

            <p className="mt-6 font-display text-4xl font-extrabold tracking-tight">
              ${p.price}
              <span
                className={`ml-1 text-base font-semibold ${on ? "text-bg/75" : "text-ink-soft"}`}
              >
                / month + GST
              </span>
            </p>
            <p
              className={`mt-1 text-sm ${on ? "text-bg/75" : "text-ink-soft"}`}
            >
              14-day free trial. Cancel anytime.
            </p>

            <Link
              href={`/signup?plan=${p.name}`}
              className={`mt-7 rounded-xl px-5 py-3.5 text-center font-semibold transition-colors duration-200 ${
                on
                  ? "bg-bg text-ink hover:bg-surface"
                  : "bg-ink text-bg hover:bg-ink/85"
              }`}
            >
              Start free trial
            </Link>

            <hr className={`my-7 ${on ? "border-bg/20" : "border-line"}`} />

            <ul className="space-y-3 font-medium">
              {p.top.map((t) => (
                <li key={t} className="flex gap-3">
                  <span
                    className={`mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full ${on ? "bg-accent" : "bg-ink"}`}
                  />
                  {t}
                </li>
              ))}
            </ul>

            <p className="mt-7 font-bold">{p.lead}</p>
            <ul
              className={`mt-4 space-y-3 text-sm ${on ? "text-bg/80" : "text-ink-soft"}`}
            >
              {p.features.map((f) => (
                <li key={f} className="flex gap-3">
                  <Icon
                    name="check"
                    className={`mt-0.5 h-4 w-4 shrink-0 ${on ? "text-accent" : "text-ink"}`}
                  />
                  {f}
                </li>
              ))}
            </ul>
          </article>
        );
      })}
    </div>
    <div className="mx-auto mt-8 max-w-6xl px-5 sm:px-8">
    <div
      data-reveal
      className="flex flex-col items-start justify-between gap-5 rounded-[2rem] border border-line bg-tint p-8 sm:flex-row sm:items-center"
    >
      <div>
        <p className="font-display text-2xl font-extrabold tracking-tight">
          Subcontractors are always free.
        </p>
        <p className="mt-1 max-w-xl text-ink-soft">
          A builder invites you from their own dashboard. You keep your tickets,
          insurances and SWMS in one free account and use them on every builder
          you work for.
        </p>
      </div>
      <Link
        href="/signup?type=subcontractor"
        className="shrink-0 whitespace-nowrap rounded-xl bg-ink px-6 py-3.5 font-semibold text-bg transition-colors hover:bg-ink/85"
      >
        Free subcontractor sign up
      </Link>
    </div>
    </div>
    </>
  );
}
