"use client";

import Link from "next/link";
import { Icon } from "@/components/Icons";
import { usePortal } from "@/components/portal/usePortal";
import {
  btnDark,
  Card,
  EmptyState,
  PageHeading,
  Pill,
} from "@/components/app/ui";
import { fmtDate } from "@/lib/format";

export default function PortalPlant() {
  const p = usePortal();
  const mine = p.plant
    .filter((x) => x.ownerId === p.subId && x.onboarding)
    .sort((a, b) =>
      b.onboarding!.submittedAt.localeCompare(a.onboarding!.submittedAt),
    );

  return (
    <>
      <PageHeading
        title="My plant"
        sub="Put plant forward for a site you have been allocated to. The builder checks your documents, inspects it on arrival and approves it before it can be used."
        actions={
          <Link href="/portal/plant/new" className={btnDark}>
            <Icon name="plus" className="h-4 w-4" /> Submit plant
          </Link>
        }
      />
      {mine.length === 0 ? (
        <Card>
          <EmptyState
            title="No plant submitted yet"
            body="You can submit plant that is not on site yet. It needs its documents and a site you have been allocated to."
          />
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {mine.map((x) => {
            const o = x.onboarding!;
            const site = p.projects.find((pr) => pr.id === x.projectId);
            return (
              <Link
                key={x.id}
                href={`/portal/plant/${x.id}`}
                className="block rounded-2xl border border-line bg-surface p-5 transition-colors hover:bg-tint/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-base font-extrabold tracking-tight">
                      {x.name}
                    </h2>
                    <p className="truncate text-xs text-ink-soft">
                      {x.kind} · {x.serial}
                    </p>
                  </div>
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
                      ? "Waiting for the builder"
                      : o.status}
                  </Pill>
                </div>
                <p className="mt-3 text-xs text-ink-soft">
                  {site?.name ?? "Site"} · arrives {fmtDate(o.onSiteFrom)}
                </p>
                {o.status === "Declined" && o.note && (
                  <p className="mt-2 text-sm">
                    <span className="font-semibold">Declined: </span>
                    {o.note}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
