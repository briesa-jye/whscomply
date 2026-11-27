"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/components/app/DemoStore";
import {
  btnDark,
  btnLight,
  Card,
  CardHead,
  Chips,
  EmptyState,
  Field,
  field,
  PageHeading,
} from "@/components/app/ui";
import { fmtDate } from "@/lib/format";

const KINDS = ["Service", "Maintenance"] as const;

/**
 * Record a service or a maintenance on its own page: the reading it was done at,
 * and when it is next due by date and by meter.
 */
export function PlantCare({ id }: { id: string }) {
  const s = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const [kind, setKind] = useState<(typeof KINDS)[number]>(
    params.get("kind") === "maintenance" ? "Maintenance" : "Service",
  );
  const [readingNow, setReadingNow] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [nextReading, setNextReading] = useState("");

  if (!s.ready)
    return <p className="py-10 text-center text-sm text-ink-soft">Loading plant</p>;
  const p = s.plant.find((x) => x.id === id);
  if (!p)
    return (
      <Card>
        <EmptyState title="This plant was not found." />
      </Card>
    );

  const back = `/dashboard/plant/${p.id}`;
  const unit = p.meter?.kind === "km" ? "km" : "hours";
  const n = (v: string) => (v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : null);
  const readingOk = !p.meter || (n(readingNow) !== null && n(readingNow)! >= p.meter.reading);
  const nextOk =
    !p.meter || (n(nextReading) !== null && n(nextReading)! > (n(readingNow) ?? 0));
  const problems: string[] = [];
  if (!readingOk)
    problems.push(`The ${unit} reading, at least ${p.meter?.reading}`);
  if (!nextDate) problems.push("The date it is next due");
  if (p.meter && !nextOk) problems.push(`The ${unit} reading it is next due at`);

  const last =
    kind === "Service"
      ? fmtDate(p.lastService)
      : p.maintenance
        ? fmtDate(p.maintenance.last)
        : "not recorded";

  return (
    <>
      <Link href={back} className="mb-3 inline-block text-xs font-semibold underline">
        Back to {p.name}
      </Link>
      <PageHeading
        title={`Record ${kind === "Service" ? "a service" : "maintenance"}: ${p.name}`}
        sub="It is recorded as done today."
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (problems.length) return;
          s.recordPlantCare(
            p.id,
            kind === "Service" ? "service" : "maintenance",
            {
              readingNow: p.meter ? n(readingNow) : null,
              nextDate,
              nextReading: p.meter ? n(nextReading) : null,
            },
          );
          router.push(back);
        }}
        className="space-y-6"
      >
        <Card>
          <CardHead
            title="What was done"
            sub={
              kind === "Service"
                ? "The scheduled check-up, fluid and part changes, or a call-out to fix a fault."
                : "Routine care to keep it working properly."
            }
          />
          <div className="space-y-4 p-5">
            <Chips value={kind} options={[...KINDS]} onChange={setKind} />
            <p className="text-xs text-ink-soft">Last {kind.toLowerCase()}: {last}.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {p.meter && (
                <Field
                  label={`Current ${unit} reading`}
                  hint={`last read ${p.meter.reading}`}
                >
                  <input
                    type="number"
                    min={p.meter.reading}
                    value={readingNow}
                    onChange={(e) => setReadingNow(e.target.value)}
                    className={field}
                  />
                </Field>
              )}
              <Field label="Next due on">
                <input
                  type="date"
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  className={field}
                />
              </Field>
              {p.meter && (
                <Field label={`Next due at (${unit})`}>
                  <input
                    type="number"
                    min="0"
                    value={nextReading}
                    onChange={(e) => setNextReading(e.target.value)}
                    className={field}
                  />
                </Field>
              )}
            </div>
          </div>
        </Card>
        <div className="space-y-3">
          {problems.length > 0 && (
            <p className="rounded-xl bg-accent/15 px-4 py-3 text-xs font-medium">
              Still needed: {problems.join(", ")}.
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Link href={back} className={btnLight}>
              Cancel
            </Link>
            <button
              type="submit"
              disabled={problems.length > 0}
              className={`${btnDark} disabled:cursor-not-allowed disabled:opacity-40`}
            >
              Save {kind.toLowerCase()}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
