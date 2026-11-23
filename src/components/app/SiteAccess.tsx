"use client";

import { useState } from "react";
import { Icon } from "@/components/Icons";
import { useScope } from "@/components/app/DemoStore";
import { InductModal } from "@/components/app/InductModal";
import { VisitorForm } from "@/components/app/forms2";
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
import { expiryOf, type Project, type Worker } from "@/lib/data";
import { fmtDate } from "@/lib/format";

const VISITOR_FILTERS = ["On site", "All"] as const;

const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("");

const Label = ({ children }: { children: string }) => (
  <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-ink-soft">
    {children}
  </p>
);

/**
 * Everything about who is allowed on one project's site: induction approvals
 * (direct employees and contractor workers), the worker gate, and visitors.
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
  const [vf, setVf] = useState<(typeof VISITOR_FILTERS)[number]>("On site");

  const crew = s.workers.filter((w) => w.projects.includes(project.id));
  const subOf = (w: Worker) =>
    w.company === "own" ? undefined : s.subs.find((x) => x.id === w.company);
  const companyName = (w: Worker) =>
    w.company === "own" ? "Direct employee" : (subOf(w)?.name ?? "Contractor");

  /** Why this worker cannot be approved or signed on, or null when clear. */
  const blocker = (w: Worker): string | null => {
    if (w.tickets.some((t) => expiryOf(t.expires, 0) === "expired"))
      return "Expired ticket";
    const sub = subOf(w);
    if (sub && !sub.approved) return "Contractor not approved";
    return null;
  };
  const noWhiteCard = (w: Worker) =>
    !w.tickets.some((t) => /white card/i.test(t.kind));

  const pending = crew.filter((w) => !w.inducted.includes(project.id));
  const pendingContractors = pending.filter((w) => w.company !== "own");
  const pendingEmployees = pending.filter((w) => w.company === "own");
  const records = s.inductions
    .filter((r) => r.projectId === project.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const onSite = crew.filter((w) => project.onSite.includes(w.id));
  const offSite = crew.filter((w) => !project.onSite.includes(w.id));

  const visitors = s.visitors
    .filter((v) => v.projectId === project.id)
    .filter((v) => vf === "All" || !v.outAt)
    .sort((a, b) => b.inAt.localeCompare(a.inAt));
  const visitorsOn = s.visitors.filter(
    (v) => v.projectId === project.id && !v.outAt,
  ).length;

  const PendingRow = ({ w, i }: { w: Worker; i: number }) => {
    const why = blocker(w);
    return (
      <li className="flex flex-wrap items-center gap-3 py-2">
        <Avatar initials={initials(w.name)} tone={(i % 3) as 0 | 1 | 2} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{w.name}</span>
          <span className="block truncate text-xs text-ink-soft">
            {w.role} · {companyName(w)}
            {noWhiteCard(w) && " · no white card on file"}
          </span>
        </span>
        {why && <Pill tone="owed">{why}</Pill>}
        {!readOnly && (
          <button
            type="button"
            disabled={!!why}
            title={why ?? ""}
            onClick={() => setTarget(w)}
            className={`${btnDark} !px-3 !py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40`}
          >
            Review and induct
          </button>
        )}
      </li>
    );
  };

  const GateRow = ({ w, i }: { w: Worker; i: number }) => {
    const on = project.onSite.includes(w.id);
    const inducted = w.inducted.includes(project.id);
    const why = blocker(w) ?? (!inducted ? "Needs a site induction first" : null);
    return (
      <li className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3 last:border-0">
        <Avatar initials={initials(w.name)} tone={(i % 3) as 0 | 1 | 2} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{w.name}</span>
          <span className="block truncate text-xs text-ink-soft">
            {w.role} · {companyName(w)}
          </span>
        </span>
        {!on && why && <Pill tone="owed">{why}</Pill>}
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
              disabled={!!why}
              title={why ?? ""}
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
            ["Awaiting induction", pending.length],
            ["Workers allocated", crew.length],
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
            <Label>Contractor workers waiting for approval</Label>
            {pendingContractors.length === 0 ? (
              <p className="text-sm text-ink-soft">
                No contractor workers are waiting.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {pendingContractors.map((w, i) => (
                  <PendingRow key={w.id} w={w} i={i} />
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-ink-soft">
              A contractor worker can only be approved once their company is
              approved and their tickets are current.
            </p>

            <div className="mt-5">
              <Label>Direct employees waiting for induction</Label>
              {pendingEmployees.length === 0 ? (
                <p className="text-sm text-ink-soft">
                  No employees are waiting.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {pendingEmployees.map((w, i) => (
                    <PendingRow key={w.id} w={w} i={i} />
                  ))}
                </ul>
              )}
            </div>
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
                          {s.workers.find((w) => w.id === r.workerId)?.name ??
                            "Unknown"}
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
          sub="Only inducted workers with current tickets, from approved companies, can sign on."
          right={<Pill tone="neutral">{onSite.length} on site</Pill>}
        />
        {crew.length === 0 ? (
          <EmptyState
            title="No workers allocated yet."
            body="Assign workers to this project from Personnel, or allocate a subcontractor."
          />
        ) : (
          <ul>
            {[...onSite, ...offSite].map((w, i) => (
              <GateRow key={w.id} w={w} i={i} />
            ))}
          </ul>
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
