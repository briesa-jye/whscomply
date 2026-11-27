"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icons";
import { Photo } from "@/components/app/Attachments";
import { useScope } from "@/components/app/DemoStore";
import {
  btnDark,
  Card,
  Chips,
  EmptyState,
  PageHeading,
  Pill,
} from "@/components/app/ui";
import { fmtDate } from "@/lib/format";

const FILTERS = ["To review", "Approved", "Declined", "All"] as const;

export default function PlantOnboardingPage() {
  const s = useScope();
  const [f, setF] = useState<(typeof FILTERS)[number]>("To review");

  const all = s.plantIn.filter((p) => p.onboarding);
  const list = all
    .filter((p) => {
      const st = p.onboarding!.status;
      return (
        f === "All" ||
        (f === "To review" && st === "Submitted") ||
        (f === "Approved" && st === "Approved") ||
        (f === "Declined" && st === "Declined")
      );
    })
    .sort((a, b) =>
      b.onboarding!.submittedAt.localeCompare(a.onboarding!.submittedAt),
    );
  const waiting = all.filter((p) => p.onboarding!.status === "Submitted").length;

  return (
    <>
      <PageHeading
        title="Plant onboarding"
        sub="Plant coming onto a site is checked before it is used: documents verified, an inspection on arrival, then your approval. Subcontractors put their plant forward from their portal."
        actions={
          <Link href="/dashboard/plant/onboarding/new" className={btnDark}>
            <Icon name="plus" className="h-4 w-4" /> Onboard plant
          </Link>
        }
      />
      <Card>
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <Chips value={f} options={[...FILTERS]} onChange={setF} />
          <span className="text-xs text-ink-soft">
            {waiting} waiting for review
          </span>
        </div>
        {list.length === 0 ? (
          <EmptyState
            title={f === "To review" ? "Nothing is waiting." : "No plant here."}
            body="Plant that a subcontractor puts forward, or that you onboard yourself, appears here."
          />
        ) : (
          <ul>
            {list.map((p) => {
              const o = p.onboarding!;
              const nowDocs = o.docs.filter((d) => !d.later);
              const verified = nowDocs.filter((d) => d.verified).length;
              return (
                <li key={p.id} className="border-b border-line last:border-0">
                  <Link
                    href={`/dashboard/plant/onboarding/${p.id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-tint/60"
                  >
                    <Photo a={p.photo?.[0]} className="h-16 w-16" />
                    <div className="grid min-w-0 flex-1 items-center gap-3 md:grid-cols-[1.6fr_1fr_1fr_auto]">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">
                        {p.name}
                      </span>
                      <span className="block truncate text-xs text-ink-soft">
                        {p.kind} · {p.serial} · {p.owner}
                        {s.all &&
                          ` · ${s.projects.find((x) => x.id === p.projectId)?.name}`}
                      </span>
                    </span>
                    <span className="text-xs text-ink-soft">
                      Submitted {fmtDate(o.submittedAt.slice(0, 10))}
                      <span className="block">by {o.submittedBy}</span>
                    </span>
                    <span className="text-xs text-ink-soft">
                      {verified} of {nowDocs.length} documents verified
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
                        {o.status === "Submitted" ? "To review" : o.status}
                      </Pill>
                      <Icon name="arrow" className="h-4 w-4 text-ink-soft" />
                    </span>
                    </div>
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
