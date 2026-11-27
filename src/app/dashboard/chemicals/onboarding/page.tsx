"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icons";
import { useScope } from "@/components/app/DemoStore";
import {
  Card,
  Chips,
  EmptyState,
  PageHeading,
  Pill,
} from "@/components/app/ui";
import { fmtDate } from "@/lib/format";

const FILTERS = [
  "To review",
  "Waiting on contractor",
  "Approved",
  "Declined",
  "All",
] as const;

export default function ChemicalOnboardingPage() {
  const s = useScope();
  const [f, setF] = useState<(typeof FILTERS)[number]>("To review");

  const all = s.siteOnboardings.filter(
    (o) => s.all || o.projectId === s.scopeId,
  );
  const list = all
    .filter(
      (o) =>
        f === "All" ||
        (f === "To review" && o.status === "Submitted") ||
        (f === "Waiting on contractor" && o.status === "Draft") ||
        (f === "Approved" && o.status === "Approved") ||
        (f === "Declined" && o.status === "Declined"),
    )
    .sort((a, b) =>
      (b.submittedAt ?? b.startedAt).localeCompare(a.submittedAt ?? a.startedAt),
    );
  const waiting = all.filter((o) => o.status === "Submitted").length;

  return (
    <>
      <PageHeading
        title="Chemical onboarding"
        sub="Each subcontractor supplies its SWMS and a safety data sheet for every hazardous chemical it will bring, for each project it is allocated to. Until you approve it, its workers cannot be approved or signed on. Plant is handled separately."
      />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
          <Chips value={f} options={[...FILTERS]} onChange={setF} />
          <span className="text-xs text-ink-soft">
            {waiting} waiting for review
          </span>
        </div>
        {list.length === 0 ? (
          <EmptyState
            title={f === "To review" ? "Nothing is waiting." : "Nothing here."}
            body="When a subcontractor accepts an invitation to a project, its onboarding starts and appears here."
          />
        ) : (
          <ul>
            {list.map((o) => {
              const sub = s.subs.find((x) => x.id === o.subId);
              const proj = s.projects.find((x) => x.id === o.projectId);
              return (
                <li key={o.id} className="border-b border-line last:border-0">
                  <Link
                    href={`/dashboard/chemicals/onboarding/${o.id}`}
                    className="grid items-center gap-3 px-5 py-4 hover:bg-tint/60 md:grid-cols-[1.6fr_1fr_1fr_auto]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">
                        {sub?.name ?? "Subcontractor"}
                      </span>
                      <span className="block truncate text-xs text-ink-soft">
                        {proj?.name ?? "Project"}
                      </span>
                    </span>
                    <span className="text-xs text-ink-soft">
                      {o.swms.length} SWMS · {o.noChemicals ? "no chemicals" : `${o.chemicals.length} chemical${o.chemicals.length === 1 ? "" : "s"}`}
                    </span>
                    <span className="text-xs text-ink-soft">
                      {o.submittedAt
                        ? `Submitted ${fmtDate(o.submittedAt.slice(0, 10))}`
                        : `Started ${fmtDate(o.startedAt.slice(0, 10))}`}
                    </span>
                    <span className="flex items-center gap-2 justify-self-end">
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
                            ? "Waiting on contractor"
                            : o.status}
                      </Pill>
                      <Icon name="arrow" className="h-4 w-4 text-ink-soft" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
