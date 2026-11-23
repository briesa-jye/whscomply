"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/components/app/DemoStore";
import { SiteAccess } from "@/components/app/SiteAccess";
import {
  Card,
  Chips,
  EmptyState,
  PageHeading,
  Pill,
} from "@/components/app/ui";
import { fmtDate } from "@/lib/format";

const TABS = ["Overview", "Site access"] as const;

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const s = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Site access");
  const p = s.projects.find((x) => x.id === id);

  if (!s.ready)
    return (
      <p className="py-10 text-center text-sm text-ink-soft">
        Loading project
      </p>
    );
  if (!p)
    return (
      <Card>
        <EmptyState
          title="This project was not found."
          body="It may have been removed."
        />
        <p className="px-5 pb-5 text-center text-sm">
          <Link href="/dashboard/projects" className="font-semibold underline">
            Back to projects
          </Link>
        </p>
      </Card>
    );

  const facts: [string, string][] = [
    ["Client", p.client],
    ["Stage", p.stage],
    ["Manager", p.manager],
    ["Started", fmtDate(p.start)],
    ["Assembly point", p.assembly],
    ["Nearest hospital", p.hospital],
    ["Emergency contact", p.emergencyContact],
    ["Wardens", p.wardens],
  ];

  return (
    <>
      <Link
        href="/dashboard/projects"
        className="mb-3 inline-block text-xs font-semibold underline"
      >
        All projects
      </Link>
      <PageHeading
        title={p.name}
        sub={p.closedAt ? `${p.address}. Closed and stored: read-only.` : p.address}
        actions={
          <Pill tone={p.closedAt ? "neutral" : p.status === "Live" ? "owed" : "neutral"}>
            {p.closedAt ? "Archived" : p.status}
          </Pill>
        }
      />

      <div className="mb-6">
        <Chips value={tab} options={[...TABS]} onChange={setTab} />
      </div>

      {tab === "Site access" ? (
        <SiteAccess project={p} readOnly={!!p.closedAt} />
      ) : (
        <Card>
          <dl className="grid gap-x-6 gap-y-4 p-5 sm:grid-cols-2">
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-ink-soft">{k}</dt>
                <dd className="text-sm font-semibold">{v || "Not set"}</dd>
              </div>
            ))}
            <div className="sm:col-span-2">
              <dt className="text-xs text-ink-soft">Locations</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {p.locations.length === 0 && (
                  <span className="text-sm text-ink-soft">None added</span>
                )}
                {p.locations.map((l) => (
                  <span
                    key={l}
                    className="rounded-full bg-tint px-2.5 py-1 text-xs font-medium"
                  >
                    {l}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </Card>
      )}
    </>
  );
}
