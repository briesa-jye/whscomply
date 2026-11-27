"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icons";
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
import { fmtDate, todayISO } from "@/lib/format";

const FILTERS = ["All", "In service", "Out of service", "Due soon"] as const;

const due = (iso: string | null) => {
  if (!iso) return null;
  const d = daysUntil(iso);
  return d < 0
    ? { text: `Overdue ${-d}d`, tone: "owed" as const }
    : d <= 14
      ? { text: `${d} days`, tone: "owed" as const }
      : { text: fmtDate(iso), tone: "ok" as const };
};

export default function PlantPage() {
  const s = useScope();
  const [f, setF] = useState<(typeof FILTERS)[number]>("All");
  const [service, setService] = useState<Plant | null>(null);
  const [tag, setTag] = useState<Plant | null>(null);

  // Plant only appears here once it has been approved for site.
  const approved = s.plantIn.filter((p) => plantApproval(p) === "Approved");
  const waiting = s.plantIn.filter(
    (p) => p.onboarding?.status === "Submitted",
  ).length;
  const list = approved.filter(
    (p) =>
      f === "All" ||
      (f === "Due soon"
        ? daysUntil(p.nextService) <= 14 ||
          (p.tagDue !== null && daysUntil(p.tagDue) <= 14)
        : p.status === f),
  );

  return (
    <>
      <PageHeading
        title="Plant and equipment"
        sub="Approved plant on site, including plant brought by subcontractors. Daily pre-starts, services, test and tag, and defects that take plant out of service."
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
      <Card>
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <Chips value={f} options={[...FILTERS]} onChange={setF} />
          <span className="text-xs text-ink-soft">
            {list.length} item{list.length === 1 ? "" : "s"}
          </span>
        </div>
        {list.length === 0 ? (
          <EmptyState
            title="No plant here."
            body="Add the equipment on site so pre-starts and services are tracked."
          />
        ) : (
          <ul>
            {list.map((p) => {
              const svc = due(p.nextService);
              const tg = due(p.tagDue);
              const prestartDone = p.lastPrestart === todayISO();
              const out = p.status === "Out of service";
              return (
                <li
                  key={p.id}
                  className={`border-b border-line px-5 py-4 last:border-0 ${out ? "bg-accent/[0.07] shadow-[inset_3px_0_0_var(--accent)]" : ""}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-xs text-ink-soft">
                        {s.all &&
                          `${s.projects.find((x) => x.id === p.projectId)?.name} · `}
                        {p.kind} · {p.serial} · {p.owner}
                      </p>
                    </div>
                    <Pill
                      tone={
                        out
                          ? "solid"
                          : p.status === "Off site"
                            ? "neutral"
                            : "ok"
                      }
                    >
                      {p.status}
                    </Pill>
                  </div>
                  {out && p.defect && (
                    <p className="mt-2 text-sm">{p.defect}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <Pill tone={prestartDone ? "ok" : "neutral"}>
                      {prestartDone
                        ? "Pre-start done today"
                        : "Pre-start not done today"}
                    </Pill>
                    {p.ownerId && p.ownerId !== "own" && (
                      <Pill tone="neutral">Contractor plant</Pill>
                    )}
                    {svc && <Pill tone={svc.tone}>Service {svc.text}</Pill>}
                    {tg && <Pill tone={tg.tone}>Test and tag {tg.text}</Pill>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.status === "In service" && !prestartDone && (
                      <button
                        type="button"
                        onClick={() => s.logPrestart(p.id)}
                        className={`${btnDark} !px-3 !py-1.5 text-xs`}
                      >
                        <Icon name="check" className="h-3.5 w-3.5" /> Log
                        pre-start
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setService(p)}
                      className={`${btnLight} !px-3 !py-1.5 text-xs`}
                    >
                      Record service
                    </button>
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
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {service && (
        <DateModal
          title={`Record a service: ${service.name}`}
          label="Next service due"
          sub="The service is recorded as done today"
          initial={addDays(90)}
          submit="Save service"
          onClose={() => setService(null)}
          onSave={(d) => s.logService(service.id, d)}
        />
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
