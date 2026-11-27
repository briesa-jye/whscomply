"use client";

import Link from "next/link";
import { useState } from "react";
import { AttachmentStrip, Thumb } from "@/components/app/Attachments";
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
import { plantApproval } from "@/lib/data";
import { fmtDate, todayISO } from "@/lib/format";
import {
  operatorCheck,
  plantTypeOf,
  readingLeft,
  readingTone,
} from "@/lib/plant-types";

/**
 * One piece of plant: who may operate it, its daily pre-starts, service and maintenance,
 * and the documents it was approved with (kept here once, not uploaded again).
 */
export function PlantDetail({ id }: { id: string }) {
  const s = useStore();
  const [pick, setPick] = useState("");

  if (!s.ready)
    return <p className="py-10 text-center text-sm text-ink-soft">Loading plant</p>;
  const p = s.plant.find((x) => x.id === id);
  if (!p)
    return (
      <Card>
        <EmptyState title="This plant was not found." />
        <p className="px-5 pb-5 text-center text-sm">
          <Link href="/dashboard/plant" className="font-semibold underline">
            Back to the plant register
          </Link>
        </p>
      </Card>
    );

  const type = plantTypeOf(p);
  const typed = !!p.typeKey;
  const project = s.projects.find((x) => x.id === p.projectId);
  const contractor = !!p.ownerId && p.ownerId !== "own";
  const ownerName = contractor
    ? (s.subs.find((x) => x.id === p.ownerId)?.name ?? p.owner)
    : "Company plant";
  const approved = plantApproval(p) === "Approved";
  const nameOf = (wid: string) =>
    s.workers.find((w) => w.id === wid)?.name ?? "Unknown";
  const operators = (p.operators ?? [])
    .map((wid) => s.workers.find((w) => w.id === wid))
    .filter((w): w is NonNullable<typeof w> => !!w);
  const candidates = s.workers.filter(
    (w) =>
      w.inducted.includes(p.projectId) && !(p.operators ?? []).includes(w.id),
  );
  const todayDone = p.lastPrestart === todayISO();
  const svc = readingLeft(p, "service");
  const mnt = readingLeft(p, "maintenance");
  const canPrestart =
    approved && p.status === "In service" && (!typed || operators.length > 0);

  return (
    <>
      <Link
        href="/dashboard/plant"
        className="mb-3 inline-block text-xs font-semibold underline"
      >
        Back to the plant register
      </Link>
      <PageHeading
        title={p.name}
        sub={`${typed ? type.label : p.kind} · ${p.serial}${p.meter ? ` · ${p.meter.reading} ${p.meter.kind}` : ""}`}
        actions={
          <Pill tone={p.status === "Out of service" ? "solid" : p.status === "Off site" ? "neutral" : "ok"}>
            {p.status}
          </Pill>
        }
      />

      <div className="space-y-6">
        <Card>
          <div className="flex flex-wrap items-center gap-5 p-5">
            {p.photo?.[0] ? (
              <Thumb a={p.photo[0]} className="h-24 w-24" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-line text-xs text-ink-soft">
                No photo
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-bg">
                {project?.name ?? "No site"}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${contractor ? "border border-accent bg-accent/15" : "bg-tint text-ink-soft"}`}
              >
                {contractor ? `Contractor: ${ownerName}` : "Company plant"}
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHead
            title="Operators"
            sub={
              typed
                ? `Chosen from people inducted to ${project?.name ?? "the site"}. Each needs: ${type.licence.toLowerCase()}.`
                : "An older record: licences are not checked for this plant."
            }
            right={
              <Pill tone={operators.length || !typed ? "ok" : "owed"}>
                {operators.length} assigned
              </Pill>
            }
          />
          {operators.length === 0 ? (
            <p className="p-5 text-sm text-ink-soft">
              {typed
                ? "No operators yet. Add the people who will run this plant before its first pre-start."
                : "No operators assigned. Anyone inducted to the site can be recorded at a pre-start."}
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {operators.map((w) => {
                const c = operatorCheck(w, p);
                return (
                  <li
                    key={w.id}
                    className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{w.name}</span>
                      <span className="block text-xs text-ink-soft">
                        {w.role} ·{" "}
                        {w.company === "own"
                          ? "Direct employee"
                          : (s.subs.find((x) => x.id === w.company)?.name ??
                            "Contractor")}
                      </span>
                    </span>
                    <Pill tone={c.ok ? "ok" : "owed"}>
                      {c.ok ? "Licence current" : c.reason}
                    </Pill>
                    <button
                      type="button"
                      onClick={() => s.setPlantOperator(p.id, w.id, false)}
                      className="text-xs font-semibold text-ink-soft underline hover:text-ink"
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="flex flex-wrap items-center gap-2 border-t border-line bg-bg px-5 py-4">
            <select
              value={pick}
              onChange={(e) => setPick(e.target.value)}
              aria-label="Add an operator"
              className={`${field} !mt-0 max-w-xs`}
            >
              <option value="">Add someone inducted to this site</option>
              {candidates.map((w) => {
                const c = operatorCheck(w, p);
                return (
                  <option key={w.id} value={w.id} disabled={!c.ok}>
                    {w.name}
                    {c.ok ? "" : ` (${c.reason.toLowerCase()})`}
                  </option>
                );
              })}
            </select>
            <button
              type="button"
              disabled={!pick}
              onClick={() => {
                s.setPlantOperator(p.id, pick, true);
                setPick("");
              }}
              className={`${btnLight} disabled:opacity-40`}
            >
              Add operator
            </button>
          </div>
        </Card>

        <Card>
          <CardHead
            title="Daily pre-start"
            sub="Each pre-start records who operated the plant and the meter reading."
            right={
              canPrestart && !todayDone ? (
                <Link
                  href={`/dashboard/plant/${p.id}/prestart`}
                  className={`${btnDark} !px-3 !py-1.5 text-xs`}
                >
                  Log today&apos;s pre-start
                </Link>
              ) : (
                <Pill tone={todayDone ? "ok" : "owed"}>
                  {todayDone
                    ? "Done today"
                    : !approved
                      ? "Not approved"
                      : p.status !== "In service"
                        ? p.status
                        : "Assign an operator first"}
                </Pill>
              )
            }
          />
          {(p.prestarts ?? []).length === 0 ? (
            <p className="p-5 text-sm text-ink-soft">No pre-starts recorded yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {(p.prestarts ?? []).slice(0, 10).map((x) => (
                <li
                  key={x.at}
                  className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm"
                >
                  <span className="w-36 shrink-0 font-mono text-xs text-ink-soft">
                    {fmtDate(x.at.slice(0, 10))} {x.at.slice(11)}
                  </span>
                  <span className="min-w-0 flex-1">
                    {nameOf(x.operatorId)}
                    {x.reading !== null && p.meter && (
                      <span className="text-ink-soft">
                        {" "}
                        · {x.reading} {p.meter.kind}
                      </span>
                    )}
                    {x.note && (
                      <span className="block text-xs text-ink-soft">{x.note}</span>
                    )}
                  </span>
                  <Pill tone={x.result === "pass" ? "ok" : "owed"}>
                    {x.result === "pass" ? "Passed" : "Defect found"}
                  </Pill>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHead
            title="Service and maintenance"
            sub="Service is the scheduled check-up or a call-out to fix a fault. Maintenance is routine care."
          />
          <div className="grid gap-px bg-line sm:grid-cols-2">
            {(
              [
                [
                  "Service",
                  "service",
                  fmtDate(p.lastService),
                  fmtDate(p.nextService),
                  svc,
                ],
                [
                  "Maintenance",
                  "maintenance",
                  p.maintenance ? fmtDate(p.maintenance.last) : "Not recorded",
                  p.maintenance ? fmtDate(p.maintenance.next) : "Not recorded",
                  mnt,
                ],
              ] as const
            ).map(([label, key, last, next, left]) => (
              <div key={key} className="space-y-2 bg-surface p-5 text-sm">
                <p className="font-semibold">{label}</p>
                <p className="text-ink-soft">
                  Last {last}. Next due {next}.
                </p>
                {left && (
                  <Pill tone={readingTone(left.left, left.unit)}>
                    {left.left < 0
                      ? `Overdue by ${-left.left} ${left.unit}`
                      : `${left.left} ${left.unit} to go`}
                  </Pill>
                )}
                <div>
                  <Link
                    href={`/dashboard/plant/${p.id}/care?kind=${key}`}
                    className={`${btnLight} !px-3 !py-1.5 text-xs`}
                  >
                    Record {label.toLowerCase()}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHead
            title="Documents"
            sub="Uploaded once when the plant was onboarded. They stay with the plant if it moves site."
          />
          {!p.onboarding?.docs.length ? (
            <p className="p-5 text-sm text-ink-soft">
              This plant was added before onboarding existed, so it has no
              documents on file.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {p.onboarding.docs.map((d) => (
                <li key={d.id} className="space-y-2 px-5 py-3.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="min-w-0 flex-1 text-sm font-semibold">
                      {d.kind}
                    </span>
                    {d.expires ? (
                      <ExpiryPill expires={d.expires} warn={s.settings.warnDays} />
                    ) : (
                      <Pill tone="neutral">No date</Pill>
                    )}
                  </div>
                  <AttachmentStrip files={d.files} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
