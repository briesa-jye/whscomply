"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icons";
import { signInAsWorker, useScope } from "@/components/app/DemoStore";
import { SignaturePad, SignatureView } from "@/components/app/SignaturePad";
import {
  Avatar,
  btnDark,
  btnLight,
  Card,
  CardHead,
  EmptyState,
  field,
  PageHeading,
  Pill,
} from "@/components/app/ui";
import {
  meetingDue,
  meetingStatus,
  type TemplateItem,
  type Worker,
} from "@/lib/data";
import { fmtDate, todayISO } from "@/lib/format";

const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("");

const hhmm = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

/**
 * One pre-start, toolbox talk or meeting. Scheduled: details and a Start button.
 * In progress: the client's template, attendees and drawn signatures. Completed: the record.
 */
export function MeetingRecord({ id, base }: { id: string; base: string }) {
  const s = useScope();
  const router = useRouter();
  const [signing, setSigning] = useState<string | null>(null);
  const [pick, setPick] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);

  const t = s.talks.find((x) => x.id === id);

  if (!s.ready)
    return (
      <p className="py-10 text-center text-sm text-ink-soft">Loading record</p>
    );
  if (!t)
    return (
      <Card>
        <EmptyState
          title="This record was not found."
          body="It may have been deleted."
        />
        <p className="px-5 pb-5 text-center text-sm">
          <Link href={base} className="font-semibold underline">
            Back to the list
          </Link>
        </p>
      </Card>
    );

  const kind = t.kind ?? "Toolbox talk";
  const noun =
    kind === "Toolbox talk"
      ? "toolbox talk"
      : kind === "Pre-start meeting"
        ? "pre-start"
        : "meeting";
  const status = meetingStatus(t);
  const due = meetingDue(t, todayISO(), hhmm());
  const project = s.projects.find((p) => p.id === t.projectId);
  const readOnly = !!project?.closedAt;
  const sigs = t.signatures ?? [];
  const signedIds = new Set(sigs.map((g) => g.workerId));
  const sentTo = t.sentTo ?? [];
  const answers = t.answers ?? {};
  const sections = t.snapshot ?? [];
  const ids = Array.from(new Set([...t.expected, ...sigs.map((g) => g.workerId)]));
  const people = ids
    .map((i) => s.workers.find((w) => w.id === i))
    .filter((w): w is Worker => !!w);
  const canAdd = s.workers.filter(
    (w) => w.projects.includes(t.projectId) && !ids.includes(w.id),
  );
  const older = t.signatures === undefined && status === "Completed";

  const companyName = (w: Worker) =>
    w.company === "own"
      ? "Direct employee"
      : (s.subs.find((x) => x.id === w.company)?.name ?? "Contractor");
  const when = `${fmtDate(t.date)}${t.time ? ` ${t.time}` : ""}`;

  const setAnswer = (item: TemplateItem, v: string) =>
    s.updateTalk(t.id, { answers: { ...answers, [item.id]: v } });

  const finish = () => {
    const missing = sections
      .flatMap((sec) => sec.items)
      .filter((it) => it.required && !(answers[it.id] ?? "").trim())
      .map((it) => it.label);
    const issues: string[] = [];
    if (missing.length)
      issues.push(`Answer the required items: ${missing.join(", ")}.`);
    if (sigs.length === 0) issues.push("At least one attendee needs to sign.");
    setProblems(issues);
    if (issues.length) return;
    const unsigned = people.filter((w) => !signedIds.has(w.id));
    if (unsigned.length && !confirm) {
      setConfirm(true);
      return;
    }
    s.completeMeeting(t.id);
    setConfirm(false);
  };

  const answerText = (item: TemplateItem) => {
    const v = answers[item.id] ?? "";
    if (item.type === "tick") return v === "done" ? "Done" : "Not ticked";
    if (item.type === "yesno")
      return v === "yes" ? "Yes" : v === "no" ? "No" : v === "na" ? "N/A" : "No answer";
    return v || "No answer";
  };

  const control = (item: TemplateItem) => {
    const v = answers[item.id] ?? "";
    const mark = item.required ? " *" : "";
    if (item.type === "tick")
      return (
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm ${v === "done" ? "border-ink bg-tint/50" : "border-line"}`}
        >
          <input
            type="checkbox"
            checked={v === "done"}
            onChange={(e) => setAnswer(item, e.target.checked ? "done" : "")}
            className="mt-0.5 accent-[var(--ink)]"
          />
          {item.label}
          {mark}
        </label>
      );
    return (
      <div className="text-sm">
        <p className="mb-1.5 font-medium">
          {item.label}
          {mark}
        </p>
        {item.type === "yesno" && (
          <div className="flex gap-1.5">
            {(
              [
                ["yes", "Yes"],
                ["no", "No"],
                ["na", "N/A"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                aria-pressed={v === k}
                onClick={() => setAnswer(item, v === k ? "" : k)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold ${v === k ? "bg-ink text-bg" : "bg-tint text-ink-soft hover:text-ink"}`}
              >
                {l}
              </button>
            ))}
          </div>
        )}
        {item.type === "text" && (
          <textarea
            rows={2}
            value={v}
            onChange={(e) => setAnswer(item, e.target.value)}
            className={field}
          />
        )}
        {item.type === "number" && (
          <input
            type="number"
            value={v}
            onChange={(e) => setAnswer(item, e.target.value)}
            className={`${field} max-w-40`}
          />
        )}
      </div>
    );
  };

  const attendeeRow = (w: Worker, i: number) => {
    const sig = sigs.find((g) => g.workerId === w.id);
    const sent = sentTo.includes(w.id);
    const first = w.name.split(" ")[0];
    return (
      <li key={w.id} className="border-b border-line px-5 py-3 last:border-0">
        <div className="flex flex-wrap items-center gap-3">
          <Avatar initials={initials(w.name)} tone={(i % 3) as 0 | 1 | 2} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              {w.name}
            </span>
            <span className="block truncate text-xs text-ink-soft">
              {w.role} · {companyName(w)}
            </span>
          </span>
          {sig ? (
            <>
              <SignatureView path={sig.path} className="h-10 w-auto text-ink" />
              <Pill tone="ok">
                Signed {sig.at.slice(11)}
                {sig.mode === "profile" ? " on their profile" : ""}
              </Pill>
            </>
          ) : (
            !readOnly && (
              <>
                {sent && <Pill tone="neutral">Waiting for their profile</Pill>}
                <button
                  type="button"
                  onClick={() => setSigning(signing === w.id ? null : w.id)}
                  className={`${btnDark} !px-3 !py-1.5 text-xs`}
                >
                  {sent ? "Sign here instead" : "Sign on this device"}
                </button>
                {!sent ? (
                  <button
                    type="button"
                    onClick={() => s.sendToProfile(t.id, w.id)}
                    className={`${btnLight} !px-3 !py-1.5 text-xs`}
                  >
                    Send to their profile
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      signInAsWorker(w.id);
                      router.push("/me");
                    }}
                    className="text-xs font-semibold underline"
                  >
                    Open as {first} (demo)
                  </button>
                )}
                <button
                  type="button"
                  aria-label={`Remove ${w.name}`}
                  onClick={() => s.removeAttendee(t.id, w.id)}
                  className="text-ink-soft hover:text-ink"
                >
                  <Icon name="close" className="h-4 w-4" />
                </button>
              </>
            )
          )}
        </div>
        {signing === w.id && !sig && (
          <div className="mt-3 rounded-2xl bg-bg p-4">
            <SignaturePad
              name={w.name}
              onSave={(path) => {
                s.signMeeting(t.id, w.id, path, "device");
                setSigning(null);
              }}
              onCancel={() => setSigning(null)}
              saveLabel="Sign and confirm attendance"
            />
          </div>
        )}
      </li>
    );
  };

  const details = (
    <Card>
      <dl className="grid gap-x-6 gap-y-3 p-5 sm:grid-cols-4">
        {[
          ["Project", project?.name ?? "Unknown"],
          [kind === "Toolbox talk" || kind === "Pre-start meeting" ? "Presenter" : "Chair", t.presenter],
          ["When", when],
          ["Template", t.templateName ?? "None"],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs text-ink-soft">{k}</dt>
            <dd className="text-sm font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );

  return (
    <>
      <Link
        href={base}
        className="mb-3 inline-block text-xs font-semibold underline"
      >
        Back to the list
      </Link>
      <PageHeading
        title={t.topic}
        sub={`${kind}${t.spontaneous ? " · started on the spot" : ""}`}
        actions={
          <Pill tone={due ? "owed" : status === "Completed" ? "ok" : "neutral"}>
            {due ? "Due now" : status}
          </Pill>
        }
      />

      {status === "Scheduled" && (
        <div className="space-y-6">
          {due && (
            <p className="rounded-xl bg-accent/15 px-4 py-3 text-sm font-medium">
              This {noun} is due now. Start it when the crew is together.
            </p>
          )}
          {details}
          {!readOnly && (
            <Card>
              <CardHead
                title="Details"
                sub={`${t.expected.length} ${t.expected.length === 1 ? "person is" : "people are"} on the crew list. Everyone signs when it starts.`}
              />
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  Topic
                  <input
                    value={t.topic}
                    onChange={(e) => s.updateTalk(t.id, { topic: e.target.value })}
                    className={field}
                  />
                </label>
                <label className="block text-sm font-medium">
                  {kind === "Toolbox talk" || kind === "Pre-start meeting" ? "Presenter" : "Chair"}
                  <input
                    value={t.presenter}
                    onChange={(e) =>
                      s.updateTalk(t.id, { presenter: e.target.value })
                    }
                    className={field}
                  />
                </label>
                <label className="block text-sm font-medium">
                  Date
                  <input
                    type="date"
                    value={t.date}
                    onChange={(e) => s.updateTalk(t.id, { date: e.target.value })}
                    className={field}
                  />
                </label>
                <label className="block text-sm font-medium">
                  Time
                  <input
                    type="time"
                    value={t.time ?? ""}
                    onChange={(e) =>
                      s.updateTalk(t.id, { time: e.target.value || undefined })
                    }
                    className={field}
                  />
                </label>
                <label className="block text-sm font-medium sm:col-span-2">
                  Key points or agenda
                  <textarea
                    rows={4}
                    value={t.notes}
                    onChange={(e) => s.updateTalk(t.id, { notes: e.target.value })}
                    className={field}
                  />
                </label>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-4">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete this ${noun}?`)) {
                      s.removeTalk(t.id);
                      router.push(base);
                    }
                  }}
                  className="text-xs font-semibold text-ink-soft underline hover:text-ink"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => s.startMeeting(t.id)}
                  className={btnDark}
                >
                  Start {noun} now
                </button>
              </div>
            </Card>
          )}
        </div>
      )}

      {status === "In progress" && (
        <div className="space-y-6">
          {details}

          <Card>
            <CardHead
              title="Key points"
              sub="Add to this as you go."
            />
            <div className="p-5">
              <textarea
                rows={t.notes ? 6 : 3}
                value={t.notes}
                onChange={(e) => s.updateTalk(t.id, { notes: e.target.value })}
                disabled={readOnly}
                aria-label="Key points"
                className={field}
              />
            </div>
          </Card>

          {sections.map((sec) => (
            <Card key={sec.id}>
              <CardHead title={sec.title} />
              <ul className="space-y-4 p-5">
                {sec.items.map((it) => (
                  <li key={it.id}>{control(it)}</li>
                ))}
              </ul>
            </Card>
          ))}

          <Card>
            <CardHead
              title="Attendance and signatures"
              sub="Pick each person's profile, then they draw their signature here, or you send it to their own profile."
              right={
                <Pill tone={sigs.length === people.length && people.length ? "ok" : "neutral"}>
                  {sigs.length} of {people.length} signed
                </Pill>
              }
            />
            {people.length === 0 ? (
              <EmptyState
                title="No one on the list yet."
                body="Add the people at this meeting below."
              />
            ) : (
              <ul>{people.map(attendeeRow)}</ul>
            )}
            {!readOnly && (
              <div className="flex flex-wrap items-center gap-2 border-t border-line bg-bg px-5 py-4">
                <select
                  value={pick}
                  onChange={(e) => setPick(e.target.value)}
                  aria-label="Add an attendee"
                  className={`${field} !mt-0 max-w-xs`}
                >
                  <option value="">Add a person from the project</option>
                  {canAdd.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} · {w.role}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!pick}
                  onClick={() => {
                    s.addAttendee(t.id, pick);
                    setPick("");
                  }}
                  className={`${btnLight} disabled:opacity-40`}
                >
                  Add
                </button>
              </div>
            )}
          </Card>

          {!readOnly && (
            <Card>
              <div className="space-y-3 p-5">
                {problems.length > 0 && (
                  <ul className="space-y-1 rounded-xl bg-accent/15 px-4 py-3 text-sm font-medium">
                    {problems.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                )}
                {confirm && (
                  <p className="rounded-xl bg-tint px-4 py-3 text-sm">
                    {people.filter((w) => !signedIds.has(w.id)).length} on the list
                    have not signed:{" "}
                    {people
                      .filter((w) => !signedIds.has(w.id))
                      .map((w) => w.name)
                      .join(", ")}
                    . They will be recorded as not attending.
                  </p>
                )}
                <div className="flex flex-wrap justify-end gap-2">
                  {confirm && (
                    <button
                      type="button"
                      onClick={() => setConfirm(false)}
                      className={btnLight}
                    >
                      Keep open
                    </button>
                  )}
                  <button type="button" onClick={finish} className={btnDark}>
                    <Icon name="check" className="h-4 w-4" />{" "}
                    {confirm ? "Complete anyway" : `Complete ${noun}`}
                  </button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {status === "Completed" && (
        <div className="space-y-6">
          {details}

          {t.notes && (
            <Card>
              <CardHead title="Key points" />
              <p className="whitespace-pre-wrap p-5 text-sm">{t.notes}</p>
            </Card>
          )}

          {sections.map((sec) => (
            <Card key={sec.id}>
              <CardHead title={sec.title} />
              <dl className="divide-y divide-line">
                {sec.items.map((it) => (
                  <div
                    key={it.id}
                    className="grid gap-1 px-5 py-3 text-sm sm:grid-cols-[1fr_1.2fr]"
                  >
                    <dt className="text-ink-soft">{it.label}</dt>
                    <dd className="whitespace-pre-wrap font-semibold">
                      {answerText(it)}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          ))}

          <Card>
            <CardHead
              title="Attendance and signatures"
              sub={
                t.completedAt
                  ? `Completed ${fmtDate(t.completedAt.slice(0, 10))} ${t.completedAt.slice(11)}`
                  : older
                    ? "Recorded before signatures were required."
                    : undefined
              }
              right={
                <Pill tone="ok">
                  {older ? t.attended.length : sigs.length} attended
                </Pill>
              }
            />
            {people.length === 0 ? (
              <EmptyState title="No attendance was recorded." />
            ) : (
              <ul>
                {people.map((w, i) => {
                  const sig = sigs.find((g) => g.workerId === w.id);
                  const here = sig || (older && t.attended.includes(w.id));
                  return (
                    <li
                      key={w.id}
                      className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3 last:border-0"
                    >
                      <Avatar
                        initials={initials(w.name)}
                        tone={(i % 3) as 0 | 1 | 2}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">
                          {w.name}
                        </span>
                        <span className="block truncate text-xs text-ink-soft">
                          {w.role} · {companyName(w)}
                          {sig &&
                            ` · ${fmtDate(sig.at.slice(0, 10))} ${sig.at.slice(11)} · ${sig.mode === "profile" ? "signed on their own profile" : "signed on the presenter's device"}`}
                        </span>
                      </span>
                      {sig ? (
                        <SignatureView
                          path={sig.path}
                          className="h-10 w-auto text-ink"
                        />
                      ) : (
                        <Pill tone={here ? "ok" : "owed"}>
                          {here
                            ? "Attended"
                            : older
                              ? "Did not attend"
                              : "Did not sign"}
                        </Pill>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
