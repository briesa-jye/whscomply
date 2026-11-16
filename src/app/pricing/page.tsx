import type { Metadata } from "next";
import { Icon } from "@/components/Icons";
import { PricingGrid } from "@/components/PricingGrid";
import { CtaBand, Eyebrow, PageHeader } from "@/components/Sections";
import { breadcrumbs, faqPage, JsonLd } from "@/lib/jsonld";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing: Small $149, Medium $349, Large $549 a Month",
  description:
    "WHSCOMPLY for builders is $149, $349 or $549 a month by the number of live projects, never per worker. Subcontractors are always free.",
  alternates: { canonical: "/pricing" },
};

const faqs = [
  [
    "Do you charge per worker?",
    "No. Builder plans follow the number of live projects you run. Every worker, subcontractor and site manager has an account of their own.",
  ],
  [
    "Are subcontractors really free?",
    "Yes. A builder onboards its subcontractors from the builder dashboard and the subcontractor account is free, with no trial and no card. Only the builder pays.",
  ],
  [
    "How does the free trial work?",
    "Every builder plan starts with a 14-day free trial. You add a card to start, nothing is charged for 14 days, and you can cancel before then.",
  ],
  [
    "What does ISO Vault cost?",
    "ISO Vault is a one-off $1,500 for each standard you want to certify: ISO 9001 (quality), ISO 45001 (health and safety) and ISO 14001 (environmental). It is separate from your monthly plan, with no subscription. The documents prepare you for an audit; a certification body issues the certificate.",
  ],
  [
    "Can we change plan later?",
    "Yes, and you see the exact cost before anything changes. An upgrade starts straight away and you pay only the difference for the rest of the month. A downgrade starts at the next billing date, with no refund for the current month. During the free trial a plan change is free. Nothing is migrated either way.",
  ],
  [
    "Is GST included?",
    "Prices are per month plus GST. Your tax invoice shows the GST separately.",
  ],
  [
    "Does an inspector need a seat?",
    "No. An inspector or client you invite gets a free read-only account that sees everything and changes nothing.",
  ],
  [
    "Can we bring our existing SWMS and tickets?",
    "Yes. We help you bring SWMS, worker details and licence dates across so you are not retyping them.",
  ],
];

export default function Pricing() {
  return (
    <>
      <JsonLd
        data={[
          faqPage(faqs.map(([q, a]) => ({ q, a }))),
          breadcrumbs(SITE_URL, [
            { name: "Home", path: "/" },
            { name: "Pricing", path: "/pricing" },
          ]),
        ]}
      />
      <PageHeader
        eyebrow="Pricing"
        title={
          <>
            Priced by project, never per <span className="tape">worker</span>.
          </>
        }
      >
        Pick the plan that fits how many live projects you run. Subcontractors
        join free. Hover or tap a plan to compare.
      </PageHeader>

      <ul
        data-reveal
        className="mx-auto mt-10 flex max-w-6xl flex-wrap gap-x-8 gap-y-3 px-5 font-semibold sm:px-8"
      >
        {[
          "No per-worker charges",
          "Subcontractors are free",
          "Inspector access is free",
          "Bring your existing records",
        ].map((t) => (
          <li key={t} className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-ink">
              <Icon name="check" className="h-3.5 w-3.5" />
            </span>
            {t}
          </li>
        ))}
      </ul>

      <PricingGrid />

      <section
        data-reveal
        className="mx-auto mt-16 max-w-6xl px-5 sm:px-8"
      >
        <div className="rounded-[2rem] bg-ink p-8 text-bg sm:p-12">
          <Eyebrow>ISO Vault</Eyebrow>
          <h2 className="mt-5 max-w-2xl font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Your ISO documents, written from your business. $1,500 once per standard.
          </h2>
          <p className="mt-4 max-w-2xl text-bg/75">
            Policies, procedures, registers, forms, an internal audit checklist and a management review template,
            tailored to your work and filled from the records you already keep. Pay once for each standard. No
            subscription.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ["ISO 9001", "Quality management"],
              ["ISO 45001", "Health and safety"],
              ["ISO 14001", "Environmental management"],
            ].map(([n, t]) => (
              <li key={n} className="rounded-2xl border border-bg/20 p-5">
                <p className="font-display text-xl font-extrabold">{n}</p>
                <p className="text-sm text-bg/75">{t}</p>
                <p className="mt-3 font-display text-2xl font-extrabold">$1,500</p>
                <p className="text-xs text-bg/60">one-off</p>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-bg/60">
            Documents prepare you for certification. A certification body accredited by JAS-ANZ audits and issues the
            certificate.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-24 grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div data-reveal>
          <Eyebrow>Questions</Eyebrow>
          <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight">
            Before you ask.
          </h2>
        </div>
        <div data-reveal className="border-t border-ink">
          {faqs.map(([q, a]) => (
            <details key={q} className="group border-b border-line py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-xl font-bold">
                {q}
                <span className="font-mono text-lg transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-lg text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
