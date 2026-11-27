"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icons";
import { Thumb } from "@/components/app/Attachments";
import { useScope } from "@/components/app/DemoStore";
import { DateModal } from "@/components/app/forms2";
import {
  btnDark,
  btnLight,
  Card,
  Chips,
  EmptyState,
  PageHeading,
  Pill,
} from "@/components/app/ui";
import { addDays, daysUntil, plantApproval, type Plant } from "@/lib/data";
import { plantTypeOf, readingLeft, readingTone } from "@/lib/plant-types";
import { fmtDate, todayISO } from "@/lib/format";

const FILTERS = ["All", "In service", "Out of service", "Due soon"] as const;
const OWNERS = ["All plant", "Company plant", "Contractor plant"] as const;

const isContractor = (p: Plant) => !!p.ownerId && p.ownerId !== "own";

const due = (iso: string | null) => {
  if (!iso) return null;
  const d = daysUntil(iso);
  return d < 0
    ? { text: `overdue ${-d}d`, tone: "owed" as const }
    : d <= 14
      ? { text: `in ${d} days`, tone: "owed" as const }
      : { text: fmtDate(iso), tone: "ok" as const };
};

export default function PlantPage() {
  const s = useScope();
  const [f, setF] = useState<(typeof FILTERS)[number]>("All");
  const [owner, setOwner] = useState<(typeof OWNERS)[number]>("All plant");
  const [tag, setTag] = useState<Plant | null>(null);

  // Plant only appears here once it has been approved for site.
  const approved = s.plantIn.filter((p) => plantApproval(p) === "Approved");
  const waiting = s.plantIn.filter(
    (p) => p.onboarding?.status === "Submitted",
  ).length;
  const dueSoon = (p: Plant) =>
    daysUntil(p.nextService) <= 14 ||
    (p.maintenance ? daysUntil(p.maintenance.next) <= 14 : false) ||
    (p.tagDue !== null && daysUntil(p.tagDue) <= 14) ||
    [readingLeft(p, "service"), readingLeft(p, "maintenance")].some(
      (r) => r && readingTone(r.left, r.unit) === "owed",
    );
  const list = approved
    .filter((p) =>
      f === "All" ? true : f === "Due soon" ? dueSoon(p) : p.status === f,
    )
    .filter(
      (p) =>
        owner === "All plant" ||
        (owner === "Contractor plant" ? isContractor(p) : !isContractor(p)),
    );

  const ownerName = (p: Plant) =>
    isContractor(p)
      ? (s.subs.find((x) => x.id === p.ownerId)?.name ?? p.owner)
      : "Company plant";

  const groups = s.projectsIn
    .map((pr) => ({
      pr,
      items: list
        .filter((p) => p.projectId === pr.id)
        .sort(
          (a, b) =>
            Number(isContractor(a)) - Number(isContractor(b)) ||
            ownerName(a).localeCompare(ownerName(b)),
        ),
    }))
    .filter((g) => g.items.length > 0);

  const row = (p: Plant, projectName: string) => {
    const type = plantTypeOf(p);
    const svcDate = due(p.nextService);
    const svcRead = readingLeft(p, "service");
    const mntDate = p.maintenance ? due(p.maintenance.next) : null;
    const mntRead = readingLeft(p, "maintenance");
    const tg = due(p.tagDue);
    const prestartDone = p.lastPrestart === todayISO();
    const out = p.status === "Out of service";
    const contractor = isContractor(p);
    return (
      <li
        key={p.id}
        className={`flex gap-4 border-b border-line px-5 py-4 last:border-0 ${out ? "bg-accent/[0.07] shadow-[inset_3px_0_0_var(--accent)]" : ""}`}
      >
        {p.photo?.[0] ? (
          <Thumb a={p.photo[0]} className="h-20 w-20" />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-line text-center text-[10px] text-ink-soft">
            No photo
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={`/dashboard/plant/${p.id}`}
                className="font-semibold hover:underline"
              >
                {p.name}
              </Link>
              <p className="text-xs text-ink-soft">
                {p.typeKey ? type.label : p.kind} · {p.serial}
                {p.meter && ` · ${p.meter.reading} ${p.meter.kind}`}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-bg">
                  {projectName}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${contractor ? "border border-accent bg-accent/15" : "bg-tint text-ink-soft"}`}
                >
                  {contractor ? `Contractor: ${ownerName(p)}` : "Company plant"}
                </span>
              </div>
            </div>
            <Pill
              tone={
                out ? "solid" : p.status === "Off site" ? "neutral" : "ok"
              }
            >
              {p.status}
            </Pill>
          </div>
          {out && p.defect && <p className="mt-2 text-sm">{p.defect}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <Pill tone={prestartDone ? "ok" : "neutral"}>
              {prestartDone
                ? "Pre-start done today"
                : "Pre-start not done today"}
            </Pill>
            {svcDate && <Pill tone={svcDate.tone}>Service {svcDate.text}</Pill>}
            {svcRead && (
              <Pill tone={readingTone(svcRead.left, svcRead.unit)}>
                {svcRead.left < 0
                  ? `Service overdue by ${-svcRead.left} ${svcRead.unit}`
                  : `Service in ${svcRead.left} ${svcRead.unit}`}
              </Pill>
            )}
            {mntDate && (
              <Pill tone={mntDate.tone}>Maintenance {mntDate.text}</Pill>
            )}
            {mntRead && (
              <Pill tone={readingTone(mntRead.left, mntRead.unit)}>
                {mntRead.left < 0
                  ? `Maintenance overdue by ${-mntRead.left} ${mntRead.unit}`
                  : `Maintenance in ${mntRead.left} ${mntRead.unit}`}
              </Pill>
            )}
            {tg && <Pill tone={tg.tone}>Test and tag {tg.text}</Pill>}
            {p.typeKey && !p.operators?.length ? (
              <Pill tone="owed">No operators assigned</Pill>
            ) : p.operators?.length ? (
              <Pill tone="neutral">
                {p.operators.length} operator{p.operators.length === 1 ? "" : "s"}
              </Pill>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {p.status === "In service" &&
              !prestartDone &&
              (p.typeKey && !p.operators?.length ? (
                <Link
                  href={`/dashboard/plant/${p.id}`}
                  className={`${btnDark} !px-3 !py-1.5 text-xs`}
                >
                  Assign operators
                </Link>
              ) : (
                <Link
                  href={`/dashboard/plant/${p.id}/prestart`}
                  className={`${btnDark} !px-3 !py-1.5 text-xs`}
                >
                  <Icon name="check" className="h-3.5 w-3.5" /> Log pre-start
                </Link>
              ))}
            <Link
              href={`/dashboard/plant/${p.id}/care?kind=service`}
              className={`${btnLight} !px-3 !py-1.5 text-xs`}
            >
              Record service
            </Link>
            <Link
              href={`/dashboard/plant/${p.id}/care?kind=maintenance`}
              className={`${btnLight} !px-3 !py-1.5 text-xs`}
            >
              Record maintenance
            </Link>
            {p.tagDue !== null && (
              <button
                type="button"
                onClick={() => setTag(p)}
                className={`${btnLight} !px-3 !py-1.5 text-xs`}
              >
                Record test and tag
              </button>
            )}
            {p.status === "Off site" ? (
              <button
                type="button"
                onClick={() => s.setPlantStatus(p.id, "In service")}
                className={`${btnLight} !px-3 !py-1.5 text-xs`}
              >
                Return to site
              </button>
            ) : out ? (
              <button
                type="button"
                onClick={() => s.setPlantStatus(p.id, "In service")}
                className={`${btnLight} !px-3 !py-1.5 text-xs`}
              >
                Return to service
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const d = window.prompt("What is the defect?");
                  if (d?.trim())
                    s.setPlantStatus(p.id, "Out of service", d.trim());
                }}
                className={`${btnLight} !px-3 !py-1.5 text-xs`}
              >
                Report defect
              </button>
            )}
            {p.status === "In service" && (
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `Take ${p.name} off site? It leaves the active register until you return it.`,
                    )
                  )
                    s.setPlantStatus(p.id, "Off site");
                }}
                className={`${btnLight} !px-3 !py-1.5 text-xs`}
              >
                Take off site
              </button>
            )}
          </div>
        </div>
      </li>
    );
  };

  return (
    <>
      <PageHeading
        title="Plant and equipment"
        sub="Approved plant on each site, company plant and contractor plant shown separately. Daily pre-starts, services, maintenance, test and tag, and defects that take plant out of service."
        actions={
          <Link href="/dashboard/plant/onboarding/new" className={btnDark}>
            <Icon name="plus" className="h-4 w-4" /> Onboard plant
          </Link>
        }
      />
      {waiting > 0 && (
        <Link
          href="/dashboard/plant/onboarding"
          className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-accent/15 px-4 py-3 text-sm font-medium"
        >
          <span>
            {waiting} item{waiting === 1 ? "" : "s"} of plant waiting for
            approval before {waiting === 1 ? "it" : "they"} can be used.
          </span>
          <span className="font-semibold underline">Review</span>
        </Link>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <Chips value={owner} options={[...OWNERS]} onChange={setOwner} />
          <Chips value={f} options={[...FILTERS]} onChange={setF} />
        </div>
        <span className="text-xs text-ink-soft">
          {list.length} item{list.length === 1 ? "" : "s"}
          {s.all ? " across all sites" : ` on ${s.scopeLabel}`}
        </span>
      </div>

      {groups.length === 0 ? (
        <Card>
          <EmptyState
            title="No plant here."
            body="Plant appears once it has been approved for a site. Onboard plant to put it forward."
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map(({ pr, items }) => {
            const company = items.filter((p) => !isContractor(p));
            const contractor = items.filter(isContractor);
            const byContractor = Array.from(
              new Set(contractor.map((p) => ownerName(p))),
            );
            return (
              <Card key={pr.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-4">
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-extrabold tracking-tight">
                      On {pr.name}
                    </h2>
                    <p className="text-xs text-ink-soft">{pr.address}</p>
                  </div>
                  <p className="text-xs text-ink-soft">
                    {items.length} item{items.length === 1 ? "" : "s"}:{" "}
                    {company.length} company, {contractor.length} contractor
                  </p>
                </div>
                {company.length > 0 && (
                  <>
                    <p className="bg-tint/50 px-5 py-1.5 font-mono text-[11px] uppercase tracking-widest text-ink-soft">
                      Company plant · {company.length}
                    </p>
                    <ul>{company.map((p) => row(p, pr.name))}</ul>
                  </>
                )}
                {byContractor.map((name) => {
                  const mine = contractor.filter((p) => ownerName(p) === name);
                  return (
                    <div key={name}>
                      <p className="bg-tint/50 px-5 py-1.5 font-mono text-[11px] uppercase tracking-widest text-ink-soft">
                        Contractor plant · {name} · {mine.length}
                      </p>
                      <ul>{mine.map((p) => row(p, pr.name))}</ul>
                    </div>
                  );
                })}
              </Card>
            );
          })}
        </div>
      )}

      {tag && (
        <DateModal
          title={`Record test and tag: ${tag.name}`}
          label="Next test and tag due"
          initial={addDays(90)}
          submit="Save"
          onClose={() => setTag(null)}
          onSave={(d) => s.tagPlant(tag.id, d)}
        />
      )}
    </>
  );
}
