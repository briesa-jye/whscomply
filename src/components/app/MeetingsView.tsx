"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icons";
import { useScope } from "@/components/app/DemoStore";
import {
  btnDark,
  btnLight,
  Card,
  Chips,
  EmptyState,
  PageHeading,
  Pill,
  Progress,
} from "@/components/app/ui";
import {
  meetingDue,
  meetingStatus,
  type MeetingKind,
} from "@/lib/data";
import { fmtDate, todayISO } from "@/lib/format";

const FILTERS = [
  "All",
  "Due and upcoming",
  "In progress",
  "Completed",
] as const;

const hhmm = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

/**
 * The list for one kind of meeting. Creating or running one happens on its own page:
 * `${base}/new` to start now or schedule, `${base}/[id]` to run or review it.
 */
export function MeetingsView({
  kinds,
  base,
  title,
  sub,
  noun,
  emptyTitle,
  emptyBody,
}: {
  kinds: MeetingKind[];
  base: string;
  title: string;
  sub: string;
  /** what one is called in buttons, such as "pre-start" or "toolbox talk" */
  noun: string;
  emptyTitle: string;
  emptyBody: string;
}) {
  const s = useScope();
  const [f, setF] = useState<(typeof FILTERS)[number]>("All");
  const today = todayISO();
  const now = hhmm();

  const list = s.talksIn
    .filter((t) => kinds.includes(t.kind ?? "Toolbox talk"))
    .filter((t) => {
      const st = meetingStatus(t);
      return (
        f === "All" ||
        (f === "Due and upcoming" && st === "Scheduled") ||
        (f === "In progress" && st === "In progress") ||
        (f === "Completed" && st === "Completed")
      );
    })
    .sort((a, b) =>
      `${b.date} ${b.time ?? ""}`.localeCompare(`${a.date} ${a.time ?? ""}`),
    );

  return (
    <>
      <PageHeading
        title={title}
        sub={sub}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={`${base}/new`} className={btnDark}>
              <Icon name="plus" className="h-4 w-4" /> Start {noun} now
            </Link>
            <Link href={`${base}/new?when=later`} className={btnLight}>
              Schedule for later
            </Link>
            <Link href={`${base}/template`} className={btnLight}>
              Customise template
            </Link>
          </div>
        }
      />

      <Card>
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <Chips value={f} options={[...FILTERS]} onChange={setF} />
          <span className="text-xs text-ink-soft">
            {list.length} record{list.length === 1 ? "" : "s"}
          </span>
        </div>
        {list.length === 0 ? (
          <EmptyState title={emptyTitle} body={emptyBody} />
        ) : (
          <ul>
            {list.map((t) => {
              const st = meetingStatus(t);
              const due = meetingDue(t, today, now);
              const signed = (t.signatures ?? []).length;
              const legacy = t.signatures === undefined;
              const total = Math.max(
                t.expected.length,
                legacy ? t.attended.length : signed,
              );
              const count = legacy ? t.attended.length : signed;
              const pct = total ? Math.round((count / total) * 100) : 0;
              return (
                <li key={t.id} className="border-b border-line last:border-0">
                  <Link
                    href={`${base}/${t.id}`}
                    className="grid items-center gap-3 px-5 py-4 transition-colors hover:bg-tint/60 md:grid-cols-[1.6fr_1fr_1fr_auto]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">
                        {t.topic}
                      </span>
                      <span className="block truncate text-xs text-ink-soft">
                        {s.all &&
                          `${s.projects.find((p) => p.id === t.projectId)?.name} · `}
                        {fmtDate(t.date)}
                        {t.time ? ` ${t.time}` : ""} · {t.presenter}
                        {t.spontaneous && " · started on the spot"}
                      </span>
                    </span>
                    <span>
                      <Pill
                        tone={
                          due ? "owed" : st === "Completed" ? "ok" : "neutral"
                        }
                      >
                        {due
                          ? "Due now"
                          : st === "Scheduled"
                            ? "Scheduled"
                            : st}
                      </Pill>
                    </span>
                    <span className="min-w-0">
                      <span className="mb-1 flex justify-between text-xs text-ink-soft">
                        <span>{legacy ? "Attended" : "Signed"}</span>
                        <span className="tabular-nums">
                          {count}/{total}
                        </span>
                      </span>
                      <Progress
                        pct={pct}
                        tone={pct === 100 ? "ink" : "accent"}
                      />
                    </span>
                    <span className="flex items-center justify-self-end gap-2 text-xs font-semibold">
                      {due ? "Start" : st === "In progress" ? "Continue" : ""}
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
