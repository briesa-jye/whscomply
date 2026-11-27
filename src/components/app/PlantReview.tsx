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
  field,
  PageHeading,
  Pill,
} from "@/components/app/ui";
import { ExpiryPill } from "@/components/portal/ExpiryPill";
import { expiryOf, plantBlockers } from "@/lib/data";
import { fmtDate } from "@/lib/format";

/**
 * The builder's review of plant put forward for a site: check each document,
 * inspect the plant on arrival, then approve it or decline it with a reason.
 * Until it is approved the plant cannot be used.
 */
export function PlantReview({ id, base }: { id: string; base: string }) {
  const s = useStore();
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [conditions, setConditions] = useState("");

  if (!s.ready)
    return (
      <p className="py-10 text-center text-sm text-ink-soft">Loading plant</p>
    );
  const p = s.plant.find((x) => x.id === id);
  const o = p?.onboarding;
  if (!p || !o)
    return (
      <Card>
        <EmptyState
          title="This plant was not found."
          body="It may have been removed, or it was added before onboarding existed."
        />
        <p className="px-5 pb-5 text-center text-sm">
          <Link href={base} className="font-semibold underline">
            Back to plant onboarding
          </Link>
        </p>
      </Card>
    );

  const project = s.projects.find((x) => x.id === p.projectId);
  const company =
    o.ownerId === "own"
      ? "Our own plant"
      : (s.subs.find((x) => x.id === o.ownerId)?.name ?? "Subcontractor");
  const blockers = plantBlockers(o);
  const open = o.status === "Submitted";
  const verified = o.docs.filter((d) => d.verified).length;
  const answered = o.inspection.filter((c) => c.result !== null).length;

  return (
    <>
      <Link
        href={base}
        className="mb-3 inline-block text-xs font-semibold underline"
      >
        Back to plant onboarding
      </Link>
      <PageHeading
        title={p.name}
        sub={`${p.kind} · ${p.serial} · ${company}`}
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
            {o.status === "Submitted" ? "To review" : o.status}
          </Pill>
        }
      />

      <div className="space-y-6">
        <Card>
          <dl className="grid gap-x-6 gap-y-3 p-5 sm:grid-cols-4">
            {[
              ["Site", project?.name ?? "Unknown"],
              ["Arrives", fmtDate(o.onSiteFrom)],
              ["Operator", o.operator],
              ["Submitted", `${o.submittedBy}, ${fmtDate(o.submittedAt.slice(0, 10))} ${o.submittedAt.slice(11)}`],
              ["Last service", fmtDate(p.lastService)],
              ["Next service", fmtDate(p.nextService)],
              ["Test and tag", p.tagDue ? fmtDate(p.tagDue) : "Not electrical"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-ink-soft">{k}</dt>
                <dd className="text-sm font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card>
          <CardHead
            title="Documents"
            sub="Open each document, check it, then tick it as verified."
            right={
              <Pill tone={verified === o.docs.length ? "ok" : "neutral"}>
                {verified} of {o.docs.length} verified
              </Pill>
            }
          />
          <ul className="divide-y divide-line">
            {o.docs.map((d) => {
              const lapsed = !!d.expires && expiryOf(d.expires, 0) === "expired";
              return (
                <li key={d.id} className="space-y-2 px-5 py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="min-w-0 flex-1 text-sm font-semibold">
                      {d.kind}
                    </span>
                    {d.expires ? (
                      <ExpiryPill
                        expires={d.expires}
                        warn={s.settings.warnDays}
                      />
                    ) : (
                      <Pill tone="neutral">No expiry</Pill>
                    )}
                    <label
                      className={`flex items-center gap-1.5 text-xs font-semibold ${lapsed ? "opacity-50" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={d.verified}
                        disabled={!open || lapsed}
                        onChange={(e) =>
                          s.verifyPlantDoc(p.id, d.id, e.target.checked)
                        }
                        className="accent-[var(--ink)]"
                      />
                      Verified
                    </label>
                  </div>
                  {d.files?.length ? (
                    <AttachmentStrip files={d.files} />
                  ) : (
                    <p className="text-xs text-ink-soft">
                      No file attached. Ask the subcontractor to supply it
                      before you verify.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <CardHead
            title="Arrival inspection"
            sub="Walk around the plant when it arrives on site."
            right={
              <Pill tone={answered === o.inspection.length ? "ok" : "neutral"}>
                {answered} of {o.inspection.length} checked
              </Pill>
            }
          />
          <ul className="divide-y divide-line">
            {o.inspection.map((c) => (
              <li key={c.id} className="space-y-2 px-5 py-3.5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="min-w-0 flex-1 text-sm">{c.text}</span>
                  <span className="flex gap-1.5">
                    {(
                      [
                        ["pass", "Pass"],
                        ["fail", "Fail"],
                        ["na", "N/A"],
                      ] as const
                    ).map(([k, l]) => (
                      <button
                        key={k}
                        type="button"
                        disabled={!open}
                        aria-pressed={c.result === k}
                        onClick={() =>
                          s.setPlantCheck(p.id, c.id, c.result === k ? null : k)
                        }
                        className={`rounded-full px-3.5 py-1 text-xs font-semibold disabled:opacity-60 ${
                          c.result === k
                            ? k === "fail"
                              ? "bg-accent text-ink"
                              : "bg-ink text-bg"
                            : "bg-tint text-ink-soft hover:text-ink"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </span>
                </div>
                {c.result === "fail" && (
                  <input
                    value={c.note}
                    disabled={!open}
                    onChange={(e) =>
                      s.setPlantCheck(p.id, c.id, c.result, e.target.value)
                    }
                    aria-label="What failed"
                    placeholder="What failed, and what needs fixing"
                    className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm"
                  />
                )}
              </li>
            ))}
          </ul>
          {o.inspectedBy && (
            <p className="border-t border-line px-5 py-3 text-xs text-ink-soft">
              Inspected by {o.inspectedBy}
              {o.inspectedAt &&
                `, ${fmtDate(o.inspectedAt.slice(0, 10))} ${o.inspectedAt.slice(11)}`}
              .
            </p>
          )}
        </Card>

        <Card>
          <CardHead
            title="Decision"
            sub="This is the hold point: plant cannot be used on site until it is approved."
          />
          <div className="space-y-3 p-5">
            {o.status === "Approved" && (
              <>
                <p className="text-sm">
                  Approved by {o.decidedBy}
                  {o.decidedAt &&
                    `, ${fmtDate(o.decidedAt.slice(0, 10))} ${o.decidedAt.slice(11)}`}
                  . It is in the plant register and can start daily pre-starts.
                </p>
                {o.conditions && (
                  <p className="rounded-xl bg-tint px-4 py-3 text-sm">
                    <span className="font-semibold">Conditions: </span>
                    {o.conditions}
                  </p>
                )}
                <Link href="/dashboard/plant" className="text-sm font-semibold underline">
                  Open the plant register
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
            {o.status === "Withdrawn" && (
              <p className="text-sm text-ink-soft">
                The subcontractor withdrew this request.
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
                <label className="block text-sm font-medium">
                  Conditions of approval{" "}
                  <span className="font-normal text-ink-soft">(optional)</span>
                  <textarea
                    rows={2}
                    value={conditions}
                    onChange={(e) => setConditions(e.target.value)}
                    placeholder="For example: exclusion zone to be set up around the swing radius"
                    className={field}
                  />
                </label>
                {declining && (
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      s.decidePlant(p.id, "Declined", reason);
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
                    onClick={() => s.decidePlant(p.id, "Approved", conditions)}
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
