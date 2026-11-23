"use client";

import Link from "next/link";
import { useStore } from "@/components/app/DemoStore";
import { SignatureView } from "@/components/app/SignaturePad";
import {
  Avatar,
  Card,
  CardHead,
  EmptyState,
  PageHeading,
  Pill,
} from "@/components/app/ui";
import { ExpiryPill } from "@/components/portal/ExpiryPill";
import { meetingStatus } from "@/lib/data";
import { fmtDate } from "@/lib/format";

export default function MyProfile() {
  const s = useStore();
  const me = s.workers.find((w) => w.id === s.settings.workerId);

  if (!me)
    return (
      <Card>
        <EmptyState
          title="This profile was not found."
          body="Go back to the builder dashboard and open a worker from a meeting."
        />
      </Card>
    );

  const company =
    me.company === "own"
      ? s.settings.company.name
      : (s.subs.find((x) => x.id === me.company)?.name ?? "Contractor");

  const waiting = s.talks.filter(
    (t) =>
      (t.sentTo ?? []).includes(me.id) &&
      !(t.signatures ?? []).some((g) => g.workerId === me.id) &&
      meetingStatus(t) !== "Completed",
  );
  const signed = s.talks
    .flatMap((t) =>
      (t.signatures ?? [])
        .filter((g) => g.workerId === me.id)
        .map((g) => ({ t, g })),
    )
    .sort((a, b) => b.g.at.localeCompare(a.g.at));

  return (
    <div className="space-y-6">
      <PageHeading title={me.name} sub={`${me.role} · ${company}`} />

      <Card>
        <CardHead
          title="Waiting for your signature"
          sub="Sign to confirm you were at the briefing or meeting."
          right={
            waiting.length ? (
              <Pill tone="owed">{waiting.length} waiting</Pill>
            ) : (
              <Pill tone="ok">Nothing waiting</Pill>
            )
          }
        />
        {waiting.length === 0 ? (
          <p className="p-5 text-sm text-ink-soft">
            When a presenter sends you something to sign, it appears here.
          </p>
        ) : (
          <ul>
            {waiting.map((t) => (
              <li key={t.id} className="border-b border-line last:border-0">
                <Link
                  href={`/me/sign/${t.id}`}
                  className="flex items-center gap-3 px-5 py-4 hover:bg-tint/60"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {t.topic}
                    </span>
                    <span className="block truncate text-xs text-ink-soft">
                      {t.kind ?? "Toolbox talk"} ·{" "}
                      {s.projects.find((p) => p.id === t.projectId)?.name} ·{" "}
                      {fmtDate(t.date)}
                      {t.time ? ` ${t.time}` : ""}
                    </span>
                  </span>
                  <span className="text-xs font-semibold underline">Sign</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHead title="Your tickets" />
        {me.tickets.length === 0 ? (
          <p className="p-5 text-sm text-ink-soft">No tickets on file.</p>
        ) : (
          <ul className="divide-y divide-line">
            {me.tickets.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm"
              >
                <span className="min-w-0">
                  <span className="block font-semibold">{t.kind}</span>
                  <span className="block text-xs text-ink-soft">{t.number}</span>
                </span>
                <ExpiryPill expires={t.expires} warn={s.settings.warnDays} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHead title="Your sites" />
        {me.projects.length === 0 ? (
          <p className="p-5 text-sm text-ink-soft">
            You are not allocated to a site yet.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {me.projects.map((id) => (
              <li
                key={id}
                className="flex items-center justify-between gap-2 px-5 py-3 text-sm"
              >
                <span className="font-semibold">
                  {s.projects.find((p) => p.id === id)?.name ?? "Project"}
                </span>
                {me.inducted.includes(id) ? (
                  <Pill tone="ok">Inducted</Pill>
                ) : (
                  <Pill tone="owed">Not inducted</Pill>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHead title="What you have signed" />
        {signed.length === 0 ? (
          <p className="p-5 text-sm text-ink-soft">Nothing signed yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {signed.map(({ t, g }) => (
              <li
                key={`${t.id}-${g.at}`}
                className="flex flex-wrap items-center gap-3 px-5 py-3"
              >
                <Avatar
                  initials={t.topic
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")}
                  tone={0}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {t.topic}
                  </span>
                  <span className="block truncate text-xs text-ink-soft">
                    {t.kind ?? "Toolbox talk"} · {fmtDate(g.at.slice(0, 10))}{" "}
                    {g.at.slice(11)}
                  </span>
                </span>
                <SignatureView path={g.path} className="h-9 w-auto text-ink" />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
