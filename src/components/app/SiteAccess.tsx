"use client";

import { useState } from "react";
import { Icon } from "@/components/Icons";
import { useScope } from "@/components/app/DemoStore";
import { InductModal } from "@/components/app/InductModal";
import { VisitorForm } from "@/components/app/forms2";
import { ExpiryPill } from "@/components/portal/ExpiryPill";
import {
  Avatar,
  btnDark,
  btnLight,
  Card,
  CardHead,
  Chips,
  EmptyState,
  Pill,
} from "@/components/app/ui";
import {
  approvalBlockers,
  hasWhiteCard,
  signOnBlockers,
  type Project,
  type Worker,
} from "@/lib/data";
import { fmtDate, todayISO } from "@/lib/format";

const VISITOR_FILTERS = ["On site", "All"] as const;

const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("");

/** "07:12" for today, "19 Nov 07:12" for an earlier day. */
const fmtAt = (at: string) =>
  at.slice(0, 10) === todayISO()
    ? at.slice(11)
    : `${fmtDate(at.slice(0, 10))} ${at.slice(11)}`;

const Label = ({ children }: { children: string }) => (
  <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-ink-soft">
    {children}
  </p>
);

/**
 * Everything about who is allowed on one project's site: contractor access
 * requests, induction approvals, the worker gate with times, and visitors.
 * Contractor approval at company level lives under Personnel, not here.
 */
export function SiteAccess({
  project,
  readOnly = false,
}: {
  project: Project;
  readOnly?: boolean;
}) {
  const s = useScope();
  const [target, setTarget] = useState<Worker | null>(null);
  const [editing, setEditing] = useState(false);
  const [visiting, setVisiting] = useState(false);
  const [declining, setDeclining] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [vf, setVf] = useState<(typeof VISITOR_FILTERS)[number]>("On site");

  const crew = s.workers.filter((w) => w.projects.includes(project.id));
  const subOf = (w: Worker) =>
    w.company === "own" ? undefined : s.subs.find((x) => x.id === w.company);
  const companyName = (w: Worker) =>
    w.company === "own" ? "Direct employee" : (subOf(w)?.name ?? "Contractor");
  const workerById = (id: string) => s.workers.find((w) => w.id === id);

  const pending = crew.filter((w) => !w.inducted.includes(project.id));
  const pendingContractors = pending.filter((w) => w.company !== "own");
  const pendingEmployees = pending.filter((w) => w.company === "own");
  const records = s.inductions
    .filter((r) => r.projectId === project.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const requests = s.siteRequests.filter(
    (r) => r.projectId === project.id && workerById(r.workerId),
  );
  const openRequests = requests.filter((r) => r.status === "Pending");
  const decided = requests
    .filter((r) => r.status === "Approved" || r.status === "Declined")
    .sort((a, b) => (b.decidedAt ?? "").localeCompare(a.decidedAt ?? ""))
    .slice(0, 4);

  const onSite = crew.filter((w) => project.onSite.includes(w.id));
  const offSite = crew.filter((w) => !project.onSite.includes(w.id));

  const log = s.gateLog
    .filter((g) => g.projectId === project.id && workerById(g.workerId))
    .sort((a, b) => b.at.localeCompare(a.at));
  const lastEvent = (id: string) => log.find((g) => g.workerId === id);

  const visitors = s.visitors
    .filter((v) => v.projectId === project.id)
    .filter((v) => vf === "All" || !v.outAt)
    .sort((a, b) => b.inAt.localeCompare(a.inAt));
  const visitorsOn = s.visitors.filter(
    (v) => v.projectId === project.id && !v.outAt,
  ).length;

  const blockerPills = (reasons: string[]) =>
    reasons.map((r) => (
      <Pill key={r} tone="owed">
        {r}
      </Pill>
    ));

  const requestRow = (id: string) => {
    const r = openRequests.find((x) => x.id === id)!;
    const w = workerById(r.workerId)!;
    const why = approvalBlockers(w, subOf(w));
    return (
      <li key={r.id} className="py-3">
        <div className="flex flex-wrap items-center gap-3">
          <Avatar initials={initials(w.name)} tone={1} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              {w.name}
            </span>
            <span className="block truncate text-xs text-ink-soft">
              {w.role} · {companyName(w)} · asked {fmtAt(r.requestedAt)}
            </span>
          </span>
          {blockerPills(why)}
          {!readOnly && (
            <>
              <button
                type="button"
                disabled={why.length > 0}
                title={why.join(", ")}
                onClick={() => s.decideSiteRequest(r.id, "Approved")}
                className={`${btnDark} !px-3 !py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40`}
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeclining(declining === r.id ? null : r.id);
                  setReason("");
                }}
                className={`${btnLight} !px-3 !py-1.5 text-xs`}
              >
                Decline
              </button>
            </>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 pl-11 text-xs text-ink-soft">
          {w.tickets.length === 0 && <span>No tickets on file</span>}
          {w.tickets.map((t) => (
            <span key={t.id} className="inline-flex items-center gap-1.5">
              {t.kind}
              <ExpiryPill expires={t.expires} warn={s.settings.warnDays} />
            </span>
          ))}
        </div>
        {declining === r.id && (
          <form
            className="mt-3 flex gap-2 pl-11"
            onSubmit={(e) => {
              e.preventDefault();
              s.decideSiteRequest(r.id, "Declined", reason);
              setDeclining(null);
              setReason("");
            }}
          >
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              aria-label="Reason for declining"
              placeholder="Reason, so the subcontractor knows what to fix"
              required
              className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm"
            />
            <button type="submit" className={`${btnDark} !px-3 text-xs`}>
              Confirm decline
            </button>
          </form>
        )}
      </li>
    );
  };

  const pendingRow = (w: Worker, i: number) => {
    const why = approvalBlockers(w, subOf(w));
    return (
      <li key={w.id} className="flex flex-wrap items-center gap-3 py-2">
        <Avatar initials={initials(w.name)} tone={(i % 3) as 0 | 1 | 2} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{w.name}</span>
          <span className="block truncate text-xs text-ink-soft">
            {w.role} · {companyName(w)}
          </span>
        </span>
        {blockerPills(why)}
        {!readOnly && (
          <button
            type="button"
            disabled={why.length > 0}
            title={why.join(", ")}
            onClick={() => setTarget(w)}
            className={`${btnDark} !px-3 !py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40`}
          >
            Review and induct
          </button>
        )}
      </li>
    );
  };

  const gateRow = (w: Worker, i: number) => {
    const on = project.onSite.includes(w.id);
    const why = signOnBlockers(w, project.id, subOf(w));
    const last = lastEvent(w.id);
    return (
      <li
        key={w.id}
        className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3 last:border-0"
      >
        <Avatar initials={initials(w.name)} tone={(i % 3) as 0 | 1 | 2} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{w.name}</span>
          <span className="block truncate text-xs text-ink-soft">
            {w.role} · {companyName(w)}
            {last &&
              ` · ${on ? "on site since" : "last off site"} ${fmtAt(last.at)}`}
          </span>
        </span>
        {!on && blockerPills(why)}
        <Pill tone={on ? "ok" : "neutral"}>{on ? "On site" : "Off site"}</Pill>
        {!readOnly &&
          (on ? (
            <button
              type="button"
              onClick={() => s.signOff(project.id, w.id)}
              className={`${btnLight} !px-3 !py-1.5 text-xs`}
            >
              Sign off
            </button>
          ) : (
            <button
              type="button"
              disabled={why.length > 0}
              title={why.join(", ")}
              onClick={() => s.signOn(project.id, w.id)}
              className={`${btnDark} !px-3 !py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40`}
            >
              Sign on
            </button>
          ))}
      </li>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <dl className="grid grid-cols-2 divide-x divide-line text-center sm:grid-cols-4">
          {[
            ["Workers on site", onSite.length],
            ["Visitors on site", visitorsOn],
            ["Access requests", openRequests.length],
            ["Awaiting induction", pending.length],
          ].map(([k, v]) => (
            <div key={k} className="px-2 py-4">
              <dt className="text-[11px] text-ink-soft">{k}</dt>
              <dd className="font-display text-2xl font-extrabold tabular-nums">
                {v}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card>
        <CardHead
          title="Contractor access requests"
          sub="Subcontractors ask for each worker through their portal. Approve once the company is approved and the white card and tickets are current."
          right={
            openRequests.length > 0 ? (
              <Pill tone="owed">{openRequests.length} to review</Pill>
            ) : (
              <Pill tone="ok">None waiting</Pill>
            )
          }
        />
        <div className="p-5">
          {openRequests.length === 0 ? (
            <p className="text-sm text-ink-soft">
              No requests are waiting. Approved workers move to the induction
              list below.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {openRequests.map((r) => requestRow(r.id))}
            </ul>
          )}
          {decided.length > 0 && (
            <div className="mt-5">
              <Label>Recently decided</Label>
              <ul className="divide-y divide-line">
                {decided.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center gap-3 py-2 text-sm"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">
                        {workerById(r.workerId)?.name}
                      </span>
                      <span className="block truncate text-xs text-ink-soft">
                        {r.decidedBy} · {fmtAt(r.decidedAt ?? r.requestedAt)}
                        {r.note && ` · ${r.note}`}
                      </span>
                    </span>
                    <Pill tone={r.status === "Approved" ? "ok" : "owed"}>
                      {r.status}
                    </Pill>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHead
          title="Induction approvals"
          sub={`${crew.length - pending.length} of ${crew.length} allocated workers inducted to this site`}
          right={
            pending.length > 0 ? (
              <Pill tone="owed">{pending.length} waiting</Pill>
            ) : (
              <Pill tone="ok">All inducted</Pill>
            )
          }
        />
        <div className="grid gap-0 lg:grid-cols-2 lg:divide-x lg:divide-line">
          <div className="p-5">
            <Label>Contractor workers waiting for induction</Label>
            {pendingContractors.length === 0 ? (
              <p className="text-sm text-ink-soft">
                No contractor workers are waiting.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {pendingContractors.map(pendingRow)}
              </ul>
            )}

            <div className="mt-5">
              <Label>Direct employees waiting for induction</Label>
              {pendingEmployees.length === 0 ? (
                <p className="text-sm text-ink-soft">
                  No employees are waiting.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {pendingEmployees.map(pendingRow)}
                </ul>
              )}
            </div>
            <p className="mt-4 text-xs text-ink-soft">
              Everyone needs a white card on file and current tickets. Contractor
              workers also need an approved company.
            </p>
          </div>

          <div className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <Label>Induction content</Label>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => setEditing(!editing)}
                  className="-mt-2 text-xs font-semibold underline"
                >
                  {editing ? "Done" : "Edit"}
                </button>
              )}
            </div>
            <ol className="space-y-1.5 text-sm">
              {project.inductionTopics.map((t, i) => (
                <li key={t} className="flex items-start gap-2">
                  <span className="w-5 shrink-0 font-mono text-xs text-ink-soft">
                    {i + 1}
                  </span>
                  <span className="flex-1">{t}</span>
                  {editing && (
                    <button
                      type="button"
                      aria-label={`Remove topic ${i + 1}`}
                      onClick={() =>
                        s.updateProject(project.id, {
                          inductionTopics: project.inductionTopics.filter(
                            (_, k) => k !== i,
                          ),
                        })
                      }
                      className="text-ink-soft hover:text-ink"
                    >
                      <Icon name="close" className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ol>
            {editing && (
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const v = String(new FormData(form).get("topic") ?? "").trim();
                  if (v)
                    s.updateProject(project.id, {
                      inductionTopics: [...project.inductionTopics, v],
                    });
                  form.reset();
                }}
              >
                <input
                  name="topic"
                  aria-label="New topic"
                  placeholder="Add a topic specific to this site"
                  className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm"
                />
                <button type="submit" className={`${btnLight} !px-3`}>
                  Add
                </button>
              </form>
            )}

            <div className="mt-5">
              <Label>Signed records</Label>
              {records.length === 0 ? (
                <p className="text-sm text-ink-soft">
                  No inductions recorded yet.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {records.map((r) => (
                    <li key={r.id} className="flex items-center gap-3 py-2 text-sm">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">
                          {workerById(r.workerId)?.name ?? "Unknown"}
                        </span>
                        <span className="block truncate text-xs text-ink-soft">
                          {fmtDate(r.date)} · by {r.by} · signed as {r.signedAs}
                        </span>
                      </span>
                      <Pill tone="ok">{r.topics} topics</Pill>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHead
          title="Worker sign in and out"
          sub="Only inducted workers with a white card and current tickets, from approved companies, can sign on."
          right={<Pill tone="neutral">{onSite.length} on site</Pill>}
        />
        {crew.length === 0 ? (
          <EmptyState
            title="No workers allocated yet."
            body="Approve a contractor request above, or assign workers to this project from Personnel."
          />
        ) : (
          <ul>{[...onSite, ...offSite].map(gateRow)}</ul>
        )}
        {log.length > 0 && (
          <div className="border-t border-line bg-bg px-5 py-4">
            <Label>Recent gate activity</Label>
            <ul className="space-y-1 text-xs">
              {log.slice(0, 8).map((g) => (
                <li key={g.id} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 font-mono text-ink-soft">
                    {fmtAt(g.at)}
                  </span>
                  <Pill tone={g.kind === "on" ? "ok" : "neutral"}>
                    {g.kind === "on" ? "Signed on" : "Signed off"}
                  </Pill>
                  <span className="min-w-0 truncate font-semibold">
                    {workerById(g.workerId)?.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {crew.some((w) => !hasWhiteCard(w)) && (
          <p className="border-t border-line px-5 py-3 text-xs text-ink-soft">
            Workers without a white card on file are blocked until one is added
            under Personnel.
          </p>
        )}
      </Card>

      <Card>
        <CardHead
          title="Visitor sign in and out"
          sub="Everyone who enters and is not on the crew list: clients, certifiers, deliveries."
          right={
            !readOnly ? (
              <button
                type="button"
                onClick={() => setVisiting(true)}
                className={`${btnDark} !px-3 !py-1.5 text-xs`}
              >
                <Icon name="plus" className="h-4 w-4" /> Sign in visitor
              </button>
            ) : undefined
          }
        />
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <Chips value={vf} options={[...VISITOR_FILTERS]} onChange={setVf} />
          <span className="text-xs text-ink-soft">
            {visitors.length} visitor{visitors.length === 1 ? "" : "s"}
          </span>
        </div>
        {visitors.length === 0 ? (
          <EmptyState title="No visitors on site." />
        ) : (
          <ul>
            {visitors.map((v, i) => (
              <li
                key={v.id}
                className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3.5 last:border-0"
              >
                <Avatar initials={initials(v.name)} tone={(i % 3) as 0 | 1 | 2} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {v.name}
                  </span>
                  <span className="block truncate text-xs text-ink-soft">
                    {v.company} · {v.purpose} · host {v.host}
                  </span>
                  <span className="block font-mono text-[11px] text-ink-soft">
                    In {fmtDate(v.inAt.slice(0, 10))} {v.inAt.slice(11)}
                    {v.outAt && ` · out ${v.outAt.slice(11)}`}
                  </span>
                </span>
                <Pill tone={v.inducted ? "ok" : "owed"}>
                  {v.inducted ? "Inducted" : "Escort required"}
                </Pill>
                {v.outAt ? (
                  <Pill tone="neutral">Signed out</Pill>
                ) : (
                  !readOnly && (
                    <button
                      type="button"
                      onClick={() => s.signOutVisitor(v.id)}
                      className={`${btnLight} !px-3 !py-1.5 text-xs`}
                    >
                      Sign out
                    </button>
                  )
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {target && (
        <InductModal
          project={project}
          worker={target}
          onClose={() => setTarget(null)}
        />
      )}
      {visiting && (
        <VisitorForm projectId={project.id} onClose={() => setVisiting(false)} />
      )}
    </div>
  );
}
