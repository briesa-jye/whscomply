"use client";

import Link from "next/link";
import { useState } from "react";
import { AttachmentStrip } from "@/components/app/Attachments";
import { useStore } from "@/components/app/DemoStore";
import {
  btnDark,
  btnLight,
  Card,
  CardHead,
  EmptyState,
  PageHeading,
  Pill,
} from "@/components/app/ui";
import { sdsOld, siteOnboardingBlockers } from "@/lib/data";
import { fmtDate } from "@/lib/format";

/**
 * The builder's review of a subcontractor's SWMS and safety data sheets for one project.
 * Approving it clears the hold point for that subcontractor's workers and puts its
 * chemicals on the site register.
 */
export function SiteOnboardingReview({
  id,
  base,
}: {
  id: string;
  base: string;
}) {
  const s = useStore();
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");

  if (!s.ready)
    return (
      <p className="py-10 text-center text-sm text-ink-soft">Loading</p>
    );
  const o = s.siteOnboardings.find((x) => x.id === id);
  if (!o)
    return (
      <Card>
        <EmptyState
          title="This onboarding was not found."
          body="It may have been removed."
        />
        <p className="px-5 pb-5 text-center text-sm">
          <Link href={base} className="font-semibold underline">
            Back to chemical onboarding
          </Link>
        </p>
      </Card>
    );

  const sub = s.subs.find((x) => x.id === o.subId);
  const project = s.projects.find((x) => x.id === o.projectId);
  const blockers = siteOnboardingBlockers(o);
  const open = o.status === "Submitted";
  const plant = s.plant.filter(
    (x) => x.ownerId === o.subId && x.projectId === o.projectId && x.onboarding,
  );
  const workers = s.workers.filter(
    (w) => w.company === o.subId && w.projects.includes(o.projectId),
  );

  return (
    <>
      <Link
        href={base}
        className="mb-3 inline-block text-xs font-semibold underline"
      >
        Back to chemical onboarding
      </Link>
      <PageHeading
        title={sub?.name ?? "Subcontractor"}
        sub={`SWMS and safety data sheets for ${project?.name ?? "the project"}`}
        actions={
          <Pill
            tone={
              o.status === "Approved"
                ? "ok"
                : o.status === "Declined"
                  ? "owed"
                  : "neutral"
            }
          >
            {o.status === "Submitted"
              ? "To review"
              : o.status === "Draft"
                ? "Waiting on the subcontractor"
                : o.status}
          </Pill>
        }
      />

      <div className="space-y-6">
        {o.status === "Draft" && (
          <p className="rounded-xl bg-tint px-4 py-3 text-sm">
            {sub?.name} has not submitted this yet. Until you approve it, its
            workers cannot be approved or signed on at this site.
          </p>
        )}

        <Card>
          <CardHead
            title="SWMS"
            sub="Open each one, check it covers the work, then tick it as verified."
            right={
              <Pill
                tone={
                  o.swms.length && o.swms.every((x) => x.verified)
                    ? "ok"
                    : "neutral"
                }
              >
                {o.swms.filter((x) => x.verified).length} of {o.swms.length}{" "}
                verified
              </Pill>
            }
          />
          {o.swms.length === 0 ? (
            <p className="p-5 text-sm text-ink-soft">None supplied yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {o.swms.map((x) => (
                <li key={x.id} className="space-y-2 px-5 py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="min-w-0 flex-1 text-sm font-semibold">
                      {x.title || "Untitled"}
                    </span>
                    <label className="flex items-center gap-1.5 text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={x.verified}
                        disabled={!open}
                        onChange={(e) =>
                          s.verifySiteItem(o.id, "swms", x.id, e.target.checked)
                        }
                        className="accent-[var(--ink)]"
                      />
                      Verified
                    </label>
                  </div>
                  {x.files.length ? (
                    <AttachmentStrip files={x.files} />
                  ) : (
                    <p className="text-xs text-ink-soft">
                      No file attached. Ask for it before you verify.
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHead
            title="Hazardous chemicals and SDS"
            sub={
              o.noChemicals
                ? "The subcontractor says it will bring no hazardous chemicals."
                : "Each chemical needs a current safety data sheet. Verified ones go onto the site register when you approve."
            }
            right={
              !o.noChemicals ? (
                <Pill
                  tone={
                    o.chemicals.length && o.chemicals.every((x) => x.verified)
                      ? "ok"
                      : "neutral"
                  }
                >
                  {o.chemicals.filter((x) => x.verified).length} of{" "}
                  {o.chemicals.length} verified
                </Pill>
              ) : undefined
            }
          />
          {!o.noChemicals &&
            (o.chemicals.length === 0 ? (
              <p className="p-5 text-sm text-ink-soft">None listed yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {o.chemicals.map((c) => (
                  <li key={c.id} className="space-y-2 px-5 py-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">
                          {c.name}
                        </span>
                        <span className="block text-xs text-ink-soft">
                          {c.supplier} · {c.quantity || "quantity not given"} ·
                          stored at {c.location}
                        </span>
                      </span>
                      <Pill tone="neutral">{c.hazard}</Pill>
                      <Pill tone={sdsOld(c.sdsDate) ? "owed" : "ok"}>
                        {sdsOld(c.sdsDate)
                          ? "SDS over 5 years old"
                          : `SDS ${fmtDate(c.sdsDate ?? "")}`}
                      </Pill>
                      <label className="flex items-center gap-1.5 text-xs font-semibold">
                        <input
                          type="checkbox"
                          checked={c.verified}
                          disabled={!open}
                          onChange={(e) =>
                            s.verifySiteItem(
                              o.id,
                              "chemicals",
                              c.id,
                              e.target.checked,
                            )
                          }
                          className="accent-[var(--ink)]"
                        />
                        Verified
                      </label>
                    </div>
                    {c.files.length ? (
                      <AttachmentStrip files={c.files} />
                    ) : (
                      <p className="text-xs text-ink-soft">
                        No SDS file attached. Ask for it before you verify.
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ))}
        </Card>

        <Card>
          <CardHead
            title="Plant"
            sub="Not part of this hold point. It is approved separately before it is used."
          />
          <div className="space-y-2 p-5 text-sm">
            <p>
              {plant.length
                ? `${plant.length} item${plant.length === 1 ? "" : "s"} of plant put forward for this site.`
                : o.plantLater
                  ? "The subcontractor will submit plant later."
                  : "No plant has been put forward."}
            </p>
            <Link
              href="/dashboard/plant/onboarding"
              className="font-semibold underline"
            >
              Open plant onboarding
            </Link>
          </div>
        </Card>

        <Card>
          <CardHead
            title="Decision"
            sub="This is the hold point: this subcontractor's workers cannot be approved or signed on until you approve it."
          />
          <div className="space-y-3 p-5">
            {o.status === "Approved" && (
              <>
                <p className="text-sm">
                  Approved by {o.decidedBy}
                  {o.decidedAt &&
                    `, ${fmtDate(o.decidedAt.slice(0, 10))} ${o.decidedAt.slice(11)}`}
                  . Its workers can now be approved for the site
                  {workers.length
                    ? ` (${workers.length} allocated)`
                    : ""}
                  , and its chemicals are on the register.
                </p>
                <Link
                  href="/dashboard/chemicals"
                  className="text-sm font-semibold underline"
                >
                  Open the chemicals register
                </Link>
              </>
            )}
            {o.status === "Declined" && (
              <p className="text-sm">
                Declined by {o.decidedBy}.{" "}
                <span className="font-semibold">Reason: </span>
                {o.note || "No reason recorded."} The subcontractor can correct
                it and send it again.
              </p>
            )}
            {open && (
              <>
                {blockers.length > 0 && (
                  <ul className="space-y-1 rounded-xl bg-accent/15 px-4 py-3 text-sm font-medium">
                    {blockers.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                )}
                {declining && (
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      s.decideSiteOnboarding(o.id, "Declined", reason);
                      setDeclining(false);
                    }}
                  >
                    <input
                      required
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      aria-label="Reason for declining"
                      placeholder="Reason, so the subcontractor knows what to fix"
                      className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm"
                    />
                    <button type="submit" className={`${btnDark} !px-3 text-xs`}>
                      Confirm decline
                    </button>
                  </form>
                )}
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDeclining(!declining)}
                    className={btnLight}
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    disabled={blockers.length > 0}
                    onClick={() => s.decideSiteOnboarding(o.id, "Approved")}
                    className={`${btnDark} disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    Approve for site
                  </button>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
