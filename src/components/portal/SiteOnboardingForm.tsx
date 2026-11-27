"use client";

import Link from "next/link";
import { AttachField } from "@/components/app/Attachments";
import {
  btnDark,
  btnLight,
  Card,
  CardHead,
  EmptyState,
  Field,
  field,
  Pill,
} from "@/components/app/ui";
import { usePortal } from "@/components/portal/usePortal";
import {
  HAZARD_CLASSES,
  sdsOld,
  siteOnboardingProblems,
  type OnboardingSds,
  type OnboardingSwms,
} from "@/lib/data";
import { fmtDate } from "@/lib/format";

const rid = () =>
  Math.random().toString(36).slice(2, 7) + Date.now().toString(36).slice(-3);

/**
 * A subcontractor's onboarding for one project: its SWMS, and a safety data sheet for every
 * hazardous chemical it will bring. It is the hold point before its workers can be approved.
 * Plant can be skipped for now and submitted when it is ready to come to site.
 */
export function SiteOnboardingForm({ projectId }: { projectId: string }) {
  const p = usePortal();
  const o = p.siteOnboardings.find(
    (x) => x.subId === p.subId && x.projectId === projectId,
  );
  const project = p.projects.find((x) => x.id === projectId);

  if (!p.ready)
    return (
      <p className="py-10 text-center text-sm text-ink-soft">Loading</p>
    );
  if (!project || !p.projectIds.has(projectId))
    return (
      <Card>
        <EmptyState
          title="This project was not found."
          body="You can only onboard to projects you have been allocated to."
        />
        <p className="px-5 pb-5 text-center text-sm">
          <Link href="/portal/projects" className="font-semibold underline">
            Back to my projects
          </Link>
        </p>
      </Card>
    );
  if (!o)
    return (
      <Card>
        <EmptyState
          title="Nothing is needed for this project"
          body="You were allocated before site onboarding existed, so there is no SWMS or SDS submission waiting."
        />
        <p className="px-5 pb-5 text-center text-sm">
          <Link href="/portal/projects" className="font-semibold underline">
            Back to my projects
          </Link>
        </p>
      </Card>
    );

  const editable = o.status === "Draft" || o.status === "Declined";
  const problems = siteOnboardingProblems(o);
  const plant = p.plant.filter(
    (x) => x.ownerId === p.subId && x.projectId === projectId && x.onboarding,
  );

  const setSwms = (id: string, patch: Partial<OnboardingSwms>) =>
    p.saveSiteOnboarding(o.id, {
      swms: o.swms.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    });
  const setChem = (id: string, patch: Partial<OnboardingSds>) =>
    p.saveSiteOnboarding(o.id, {
      chemicals: o.chemicals.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    });

  return (
    <div className="space-y-6">
      {o.status === "Declined" && (
        <p className="rounded-xl bg-accent/15 px-4 py-3 text-sm font-medium">
          Declined: {o.note || "No reason was recorded."} Correct it below and
          send it again.
        </p>
      )}
      {o.status === "Submitted" && (
        <p className="rounded-xl bg-tint px-4 py-3 text-sm">
          Sent to the builder
          {o.submittedAt && ` on ${fmtDate(o.submittedAt.slice(0, 10))}`}. They
          are checking it. Your workers can be approved for this site once it is
          approved.
        </p>
      )}
      {o.status === "Approved" && (
        <p className="rounded-xl bg-tint px-4 py-3 text-sm">
          Approved by {o.decidedBy}
          {o.decidedAt && ` on ${fmtDate(o.decidedAt.slice(0, 10))}`}. Your
          chemicals are on the site register, and your workers can now be
          approved and signed on.
        </p>
      )}
      {o.status === "Draft" && (
        <p className="rounded-xl bg-accent/15 px-4 py-3 text-sm font-medium">
          This is a hold point: your workers cannot be approved for this site
          until the builder has approved your SWMS and safety data sheets.
        </p>
      )}

      <Card>
        <CardHead
          title="Your SWMS"
          sub="Upload the safe work method statement for each kind of high risk work you will do on this site."
        />
        {o.swms.length === 0 ? (
          <p className="p-5 text-sm text-ink-soft">No SWMS added yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {o.swms.map((x) => (
              <li key={x.id} className="space-y-3 px-5 py-4">
                <div className="flex flex-wrap items-end gap-3">
                  <Field label="Work it covers" className="min-w-56 flex-1">
                    <input
                      value={x.title}
                      disabled={!editable}
                      onChange={(e) => setSwms(x.id, { title: e.target.value })}
                      placeholder="Working at heights and scaffold erection"
                      className={field}
                    />
                  </Field>
                  {!editable && (
                    <Pill tone={x.verified ? "ok" : "neutral"}>
                      {x.verified ? "Verified" : "Not checked yet"}
                    </Pill>
                  )}
                  {editable && (
                    <button
                      type="button"
                      onClick={() =>
                        p.saveSiteOnboarding(o.id, {
                          swms: o.swms.filter((y) => y.id !== x.id),
                        })
                      }
                      className="pb-2 text-xs font-semibold text-ink-soft underline hover:text-ink"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <AttachField
                  files={x.files}
                  disabled={!editable}
                  label="Attach the SWMS"
                  onChange={(files) => setSwms(x.id, { files })}
                />
              </li>
            ))}
          </ul>
        )}
        {editable && (
          <div className="border-t border-line px-5 py-3">
            <button
              type="button"
              onClick={() =>
                p.saveSiteOnboarding(o.id, {
                  swms: [
                    ...o.swms,
                    { id: `w${rid()}`, title: "", files: [], verified: false },
                  ],
                })
              }
              className="text-xs font-semibold underline"
            >
              Add a SWMS
            </button>
          </div>
        )}
      </Card>

      <Card>
        <CardHead
          title="Hazardous chemicals and safety data sheets"
          sub="Every hazardous chemical you will bring to this site needs a safety data sheet no more than five years old."
        />
        <label className="flex items-center gap-2 border-b border-line px-5 py-3 text-sm font-medium">
          <input
            type="checkbox"
            checked={o.noChemicals}
            disabled={!editable || o.chemicals.length > 0}
            onChange={(e) =>
              p.saveSiteOnboarding(o.id, { noChemicals: e.target.checked })
            }
            className="accent-[var(--ink)]"
          />
          We will not bring any hazardous chemicals to this site
        </label>
        {!o.noChemicals && (
          <>
            {o.chemicals.length === 0 ? (
              <p className="p-5 text-sm text-ink-soft">
                No chemicals added yet.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {o.chemicals.map((c) => (
                  <li key={c.id} className="space-y-3 px-5 py-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Product name">
                        <input
                          value={c.name}
                          disabled={!editable}
                          onChange={(e) => setChem(c.id, { name: e.target.value })}
                          className={field}
                        />
                      </Field>
                      <Field label="Supplier">
                        <input
                          value={c.supplier}
                          disabled={!editable}
                          onChange={(e) =>
                            setChem(c.id, { supplier: e.target.value })
                          }
                          className={field}
                        />
                      </Field>
                      <Field label="Hazard class">
                        <select
                          value={c.hazard}
                          disabled={!editable}
                          onChange={(e) =>
                            setChem(c.id, { hazard: e.target.value })
                          }
                          className={field}
                        >
                          {HAZARD_CLASSES.map((k) => (
                            <option key={k}>{k}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Quantity on site">
                        <input
                          value={c.quantity}
                          disabled={!editable}
                          onChange={(e) =>
                            setChem(c.id, { quantity: e.target.value })
                          }
                          placeholder="4 x 20 L"
                          className={field}
                        />
                      </Field>
                      <Field label="Stored at">
                        <input
                          value={c.location}
                          disabled={!editable}
                          onChange={(e) =>
                            setChem(c.id, { location: e.target.value })
                          }
                          className={field}
                        />
                      </Field>
                      <Field label="SDS issue date">
                        <input
                          type="date"
                          value={c.sdsDate ?? ""}
                          disabled={!editable}
                          onChange={(e) =>
                            setChem(c.id, { sdsDate: e.target.value || null })
                          }
                          className={field}
                        />
                      </Field>
                    </div>
                    {sdsOld(c.sdsDate) && (
                      <p className="text-xs font-semibold">
                        This SDS is more than five years old. Ask the supplier
                        for a current one.
                      </p>
                    )}
                    <AttachField
                      files={c.files}
                      disabled={!editable}
                      label="Attach the SDS"
                      accept="image/*,.pdf"
                      onChange={(files) => setChem(c.id, { files })}
                    />
                    <div className="flex items-center justify-between gap-3">
                      {!editable ? (
                        <Pill tone={c.verified ? "ok" : "neutral"}>
                          {c.verified ? "Verified" : "Not checked yet"}
                        </Pill>
                      ) : (
                        <span />
                      )}
                      {editable && (
                        <button
                          type="button"
                          onClick={() =>
                            p.saveSiteOnboarding(o.id, {
                              chemicals: o.chemicals.filter((y) => y.id !== c.id),
                            })
                          }
                          className="text-xs font-semibold text-ink-soft underline hover:text-ink"
                        >
                          Remove chemical
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {editable && (
              <div className="border-t border-line px-5 py-3">
                <button
                  type="button"
                  onClick={() =>
                    p.saveSiteOnboarding(o.id, {
                      chemicals: [
                        ...o.chemicals,
                        {
                          id: `c${rid()}`,
                          name: "",
                          supplier: "",
                          hazard: HAZARD_CLASSES[0],
                          quantity: "",
                          location: "",
                          sdsDate: null,
                          files: [],
                          verified: false,
                        },
                      ],
                    })
                  }
                  className="text-xs font-semibold underline"
                >
                  Add a chemical
                </button>
              </div>
            )}
          </>
        )}
      </Card>

      <Card>
        <CardHead
          title="Plant"
          sub="You can skip this for now. Plant is submitted separately once it is ready to come to site, and the builder approves it before it is used."
        />
        <div className="space-y-3 p-5 text-sm">
          <label className="flex items-center gap-2 font-medium">
            <input
              type="checkbox"
              checked={o.plantLater}
              disabled={!editable}
              onChange={(e) =>
                p.saveSiteOnboarding(o.id, { plantLater: e.target.checked })
              }
              className="accent-[var(--ink)]"
            />
            We will submit plant later
          </label>
          {plant.length > 0 && (
            <p className="text-ink-soft">
              You have put forward {plant.length} item
              {plant.length === 1 ? "" : "s"} of plant for this site.
            </p>
          )}
          <Link href="/portal/plant/new" className="text-sm font-semibold underline">
            Submit plant now
          </Link>
        </div>
      </Card>

      {editable && (
        <div className="space-y-3">
          {problems.length > 0 && (
            <ul className="space-y-1 rounded-xl bg-accent/15 px-4 py-3 text-sm font-medium">
              {problems.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Link href="/portal/projects" className={btnLight}>
              Save and finish later
            </Link>
            <button
              type="button"
              disabled={problems.length > 0}
              onClick={() => p.submitSiteOnboarding(o.id)}
              className={`${btnDark} disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {o.status === "Declined"
                ? "Send again for approval"
                : "Submit for approval"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
