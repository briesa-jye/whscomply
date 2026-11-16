"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/Icons";
import { useIso } from "@/components/iso/useIso";
import { btnDark, Card, CardHead, Field, field, PageHeading, Pill, Progress } from "@/components/app/ui";
import { STANDARDS, STD_LIST } from "@/lib/iso/standards";
import type { IsoProfile } from "@/lib/iso/types";

const TYPES = ["Residential", "Commercial", "Industrial", "Civil and infrastructure", "Fit-out", "Renovation and extension", "Multi-residential", "Heritage"];
const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

const STEPS = [
  ["Tell us about the business", "The details below drive every document, so they read as yours and not as a template."],
  ["Generate the document set", "Open a standard and generate each document, or all of them at once."],
  ["Review and approve", "Read every document, correct anything that is not how you work, and approve it. Nothing counts until a person approves it."],
  ["Put it into practice", "A system has to run for a while before an auditor can see it working. Use the registers, hold the meetings and keep the records."],
  ["Run an internal audit and a management review", "Both are required before certification. The checklist and minutes templates are in each set."],
  ["Book a certification body", "Choose a body accredited by JAS-ANZ. They audit in two stages and issue the certificate. Only they can certify you."],
];

export default function IsoVaultHome() {
  const v = useIso();
  const p = v.iso.profile;
  const [saved, setSaved] = useState(false);
  const ready = !!(p.company && p.scope && p.staff && p.sites && p.topManagement);

  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const g = (k: string) => String(d.get(k) ?? "").trim();
    const patch: Partial<IsoProfile> = {
      company: g("company"),
      abn: g("abn"),
      address: g("address"),
      state: g("state"),
      scope: g("scope"),
      staff: g("staff"),
      sites: g("sites"),
      buildingTypes: TYPES.filter((t) => d.get(`t-${t}`) === "on"),
      subcontractUse: g("subcontractUse") as IsoProfile["subcontractUse"],
      hazards: g("hazards"),
      topManagement: g("topManagement"),
      topTitle: g("topTitle"),
      rep: g("rep"),
      existing: g("existing"),
      customers: g("customers"),
    };
    v.setIsoProfile(patch);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  }

  return (
    <>
      <PageHeading
        title="ISO Vault"
        sub="Your ISO 9001, ISO 45001 and ISO 14001 documents, written from your own business details and records."
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-5 text-sm">
          <Icon name="sparkle" className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <p>
            {v.aiOn === null ? (
              "Checking the AI connection."
            ) : v.aiOn ? (
              <>
                <span className="font-semibold">AI connected.</span> Each document is written by the AI from your
                details and your WHSCOMPLY records, in full depth.
              </>
            ) : (
              <>
                <span className="font-semibold">AI is not connected yet.</span> Documents are drafted by the
                built-in generator from your details and records. Connect an Anthropic key for longer,
                fully tailored documents.
              </>
            )}
          </p>
        </div>
        <div className="flex items-start gap-3 rounded-2xl border border-line bg-tint/60 p-5 text-sm">
          <Icon name="shield" className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            <span className="font-semibold">Documents do not certify you.</span> A certification body accredited
            by JAS-ANZ issues the certificate after auditing a system you have implemented. These are drafts for
            you to review, adapt and put into practice.
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHead
          title="1. Your business"
          sub="Every document uses these details"
          right={<Pill tone={ready ? "ok" : "owed"}>{ready ? "Ready to generate" : "Needs a few details"}</Pill>}
        />
        <form key={JSON.stringify(p)} onSubmit={save} className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Business name">
            <input name="company" required defaultValue={p.company} className={field} />
          </Field>
          <Field label="ABN">
            <input name="abn" defaultValue={p.abn} className={field} />
          </Field>
          <Field label="Head office address" className="sm:col-span-2">
            <input name="address" defaultValue={p.address} className={field} />
          </Field>
          <Field label="Main state">
            <select name="state" defaultValue={p.state} className={field}>
              {STATES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label="Use of subcontractors">
            <select name="subcontractUse" defaultValue={p.subcontractUse} className={field}>
              <option value="Minimal">Minimal</option>
              <option value="Moderate">Moderate, some trades</option>
              <option value="Heavy">Heavy, most trades</option>
            </select>
          </Field>
          <Field label="What the business does (the scope)" className="sm:col-span-2" hint="in your words">
            <textarea name="scope" required rows={2} defaultValue={p.scope} className={field} />
          </Field>
          <Field label="People working for you" hint="employees and regular labour">
            <input name="staff" inputMode="numeric" defaultValue={p.staff} className={field} />
          </Field>
          <Field label="Active sites at the moment">
            <input name="sites" inputMode="numeric" defaultValue={p.sites} className={field} />
          </Field>
          <fieldset className="sm:col-span-2">
            <legend className="text-sm font-medium">Types of work</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <label
                  key={t}
                  className="flex cursor-pointer items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm has-[:checked]:border-ink has-[:checked]:bg-tint"
                >
                  <input type="checkbox" name={`t-${t}`} defaultChecked={p.buildingTypes.includes(t)} className="accent-[var(--ink)]" />
                  {t}
                </label>
              ))}
            </div>
          </fieldset>
          <Field label="Your clients" hint="optional" className="sm:col-span-2">
            <input name="customers" defaultValue={p.customers} placeholder="Private home owners, developers, councils" className={field} />
          </Field>
          <Field label="The hazards you worry about most" hint="optional" className="sm:col-span-2">
            <textarea name="hazards" rows={2} defaultValue={p.hazards} placeholder="Working at height on multi-storey formwork, crane lifts in tight sites, concrete cutting dust" className={field} />
          </Field>
          <Field label="Top management" hint="signs the policies">
            <input name="topManagement" defaultValue={p.topManagement} className={field} />
          </Field>
          <Field label="Their title">
            <input name="topTitle" defaultValue={p.topTitle} className={field} />
          </Field>
          <Field label="Management representative" hint="looks after the system">
            <input name="rep" defaultValue={p.rep} className={field} />
          </Field>
          <Field label="Existing certifications or systems" hint="optional">
            <input name="existing" defaultValue={p.existing} placeholder="Prequalified with two major builders, SafeWork audit" className={field} />
          </Field>
          <div className="flex items-center gap-3 sm:col-span-2">
            <button type="submit" className={btnDark}>
              Save details
            </button>
            {saved && (
              <span role="status" className="text-sm text-ink-soft">
                Saved
              </span>
            )}
          </div>
        </form>
      </Card>

      <h2 className="mb-3 font-display text-lg font-extrabold tracking-tight">2. Choose a standard</h2>
      <div className="grid gap-6 lg:grid-cols-3">
        {STD_LIST.map((id) => {
          const m = STANDARDS[id];
          const st = v.stats(id);
          return (
            <Link
              key={id}
              href={`/dashboard/iso-vault/${id}`}
              className="group flex flex-col rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-ink"
            >
              <p className="font-mono text-[11px] uppercase tracking-widest text-ink-soft">{m.topic}</p>
              <h3 className="mt-1 font-display text-2xl font-extrabold tracking-tight">{m.name}</h3>
              <p className="mt-2 flex-1 text-sm text-ink-soft">{m.blurb}</p>
              <div className="mt-5 space-y-2">
                <Progress pct={st.pct} />
                <p className="text-xs text-ink-soft">
                  {st.approved} of {st.total} approved · {st.generated} generated · {st.mandatoryApproved} of{" "}
                  {st.mandatory} required documents approved
                </p>
              </div>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
                Open {m.short} <Icon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHead title="The path to certification" sub="What happens after the documents" />
        <ol className="divide-y divide-line">
          {STEPS.map(([t, b], i) => (
            <li key={t} className="flex gap-4 px-5 py-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20 text-sm font-bold">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold">{t}</p>
                <p className="text-sm text-ink-soft">{b}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </>
  );
}
