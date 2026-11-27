"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/components/app/DemoStore";
import {
  btnDark,
  btnLight,
  Card,
  CardHead,
  EmptyState,
  Field,
  field,
  PageHeading,
} from "@/components/app/ui";
import { plantApproval } from "@/lib/data";
import { todayISO } from "@/lib/format";
import { operatorCheck, plantTypeOf, PRESTART_CHECKS } from "@/lib/plant-types";

type Result = "pass" | "fail" | "na" | null;

/**
 * The daily pre-start for one piece of plant, on its own page: who is operating it,
 * what the meter reads, and the daily checks. A failed check takes it out of service.
 */
export function PlantPrestart({ id }: { id: string }) {
  const s = useStore();
  const router = useRouter();
  const [operatorId, setOperatorId] = useState("");
  const [reading, setReading] = useState("");
  const [results, setResults] = useState<Result[]>(
    PRESTART_CHECKS.map(() => null),
  );
  const [note, setNote] = useState("");

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
  const typed = !!p.typeKey;
  const type = plantTypeOf(p);
  const unit = p.meter?.kind === "km" ? "km" : "hours";
  const ok = plantApproval(p) === "Approved" && p.status === "In service";
  const done = p.lastPrestart === todayISO();

  // typed plant: only its assigned operators. Older records: anyone inducted to the site.
  const pool = typed
    ? (p.operators ?? [])
        .map((wid) => s.workers.find((w) => w.id === wid))
        .filter((w): w is NonNullable<typeof w> => !!w)
    : s.workers.filter((w) => w.inducted.includes(p.projectId));
  const operators = pool.filter(
    (w) => w.inducted.includes(p.projectId) && operatorCheck(w, p).ok,
  );

  const readingN = reading.trim() === "" ? null : Number(reading);
  const readingOk =
    !p.meter ||
    (readingN !== null && Number.isFinite(readingN) && readingN >= p.meter.reading);
  const failed = results.some((r) => r === "fail");
  const problems: string[] = [];
  if (!operatorId) problems.push("Who is operating it");
  if (p.meter && !readingOk)
    problems.push(
      readingN === null
        ? `The current ${unit} reading`
        : `A reading of at least ${p.meter.reading} ${unit}`,
    );
  if (results.some((r) => r === null)) problems.push("An answer for every check");
  if (failed && !note.trim()) problems.push("What the defect is");

  if (!ok || done || operators.length === 0)
    return (
      <>
        <Link href={back} className="mb-3 inline-block text-xs font-semibold underline">
          Back to {p.name}
        </Link>
        <PageHeading title={`Pre-start: ${p.name}`} />
        <Card>
          <EmptyState
            title={
              done
                ? "Today's pre-start is already done."
                : !ok
                  ? "This plant cannot be pre-started."
                  : "There is no one to record as the operator."
            }
            body={
              done
                ? "Come back tomorrow, or open the plant to see today's record."
                : !ok
                  ? "It has to be approved for the site and in service."
                  : typed
                    ? "Assign operators who are inducted to this site and hold the right licence, then log the pre-start."
                    : "Nobody inducted to this site is available."
            }
          />
          <p className="px-5 pb-5 text-center text-sm">
            <Link href={back} className="font-semibold underline">
              Open the plant
            </Link>
          </p>
        </Card>
      </>
    );

  return (
    <>
      <Link href={back} className="mb-3 inline-block text-xs font-semibold underline">
        Back to {p.name}
      </Link>
      <PageHeading
        title={`Pre-start: ${p.name}`}
        sub={`${typed ? type.label : p.kind} · ${p.serial}`}
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (problems.length) return;
          s.logPlantPrestart(p.id, {
            operatorId,
            reading: p.meter ? readingN : null,
            checks: PRESTART_CHECKS.map((text, i) => ({
              text,
              result: results[i] ?? "na",
            })),
            note,
          });
          router.push(back);
        }}
        className="space-y-6"
      >
        <Card>
          <CardHead title="Operator and meter" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Who is operating it today">
              <select
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                className={field}
              >
                <option value="" disabled>
                  Choose the operator
                </option>
                {operators.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ·{" "}
                    {w.company === "own"
                      ? "Direct employee"
                      : (s.subs.find((x) => x.id === w.company)?.name ?? "Contractor")}
                  </option>
                ))}
              </select>
            </Field>
            {p.meter && (
              <Field
                label={`Current ${unit} reading`}
                hint={`last read ${p.meter.reading}`}
              >
                <input
                  type="number"
                  min={p.meter.reading}
                  value={reading}
                  onChange={(e) => setReading(e.target.value)}
                  className={field}
                />
              </Field>
            )}
          </div>
        </Card>

        <Card>
          <CardHead
            title="Daily checks"
            sub="Answer every one. A failed check takes the plant out of service."
          />
          <ul className="divide-y divide-line">
            {PRESTART_CHECKS.map((text, i) => (
              <li
                key={text}
                className="flex flex-wrap items-center gap-3 px-5 py-3.5"
              >
                <span className="min-w-0 flex-1 text-sm">{text}</span>
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
                      aria-pressed={results[i] === k}
                      onClick={() =>
                        setResults((rs) =>
                          rs.map((r, j) => (j === i ? (r === k ? null : k) : r)),
                        )
                      }
                      className={`rounded-full px-3.5 py-1 text-xs font-semibold ${
                        results[i] === k
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
              </li>
            ))}
          </ul>
          {failed && (
            <div className="border-t border-line p-5">
              <Field label="What is the defect">
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className={field}
                />
              </Field>
            </div>
          )}
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
              {failed ? "Log defect and take out of service" : "Log pre-start"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
