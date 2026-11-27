"use client";

import Link from "next/link";
import { Invites } from "@/components/portal/Invites";
import { btnLight } from "@/components/app/ui";
import { usePortal } from "@/components/portal/usePortal";
import { Card, CardHead, EmptyState, PageHeading, Pill } from "@/components/app/ui";
import { fmtDate } from "@/lib/format";

export default function PortalProjects() {
  const p = usePortal();
  const past = p.myInvites.filter((i) => i.status === "Declined");
  const finished = p.myInvites.filter((i) => i.status === "Finished");
  const removed = p.myInvites.filter(
    (i) =>
      i.status === "Removed" && !p.myProjects.some((x) => x.id === i.projectId),
  );
  return (
    <>
      <PageHeading
        title="My projects"
        sub="Only the projects a builder has invited you to. You see nothing else on their business."
      />
      <Invites />

      {p.myProjects.length ? (
        <div className="grid gap-6 md:grid-cols-2">
          {p.myProjects.map((pr) => {
            const crew = p.crew.filter((w) => w.projects.includes(pr.id));
            const onSite = crew.filter((w) => pr.onSite.includes(w.id));
            const inducted = crew.filter((w) => w.inducted.includes(pr.id));
            const swms = p.mySwms.filter((x) => x.projectId === pr.id);
            const asked = p.myInvites.find(
              (i) =>
                i.projectId === pr.id && i.status === "Accepted" && i.finishRequested,
            );
            return (
              <Card key={pr.id}>
                <CardHead
                  title={pr.name}
                  sub={`${pr.address} · ${pr.client}`}
                  right={<Pill tone={pr.status === "Live" ? "owed" : "neutral"}>{pr.status}</Pill>}
                />
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 p-5 text-sm">
                  <div>
                    <dt className="text-xs text-ink-soft">Stage</dt>
                    <dd className="font-semibold">{pr.stage}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-soft">Site manager</dt>
                    <dd className="font-semibold">{pr.manager}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-soft">Your crew inducted</dt>
                    <dd className="font-semibold">
                      {inducted.length} of {crew.length}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-soft">On site now</dt>
                    <dd className="font-semibold">{onSite.length}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-soft">Your SWMS</dt>
                    <dd className="font-semibold">{swms.length}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-soft">Started</dt>
                    <dd className="font-semibold">{fmtDate(pr.start)}</dd>
                  </div>
                </dl>
                {(() => {
                  const ob = p.siteOnboardings.find(
                    (o) => o.subId === p.subId && o.projectId === pr.id,
                  );
                  if (!ob) return null;
                  const todo = ob.status === "Draft" || ob.status === "Declined";
                  return (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3">
                      <span className="text-sm">
                        <span className="font-semibold">Site onboarding</span>
                        <span className="block text-xs text-ink-soft">
                          Your SWMS and safety data sheets. Your crew cannot
                          start until it is approved.
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <Pill
                          tone={
                            ob.status === "Approved"
                              ? "ok"
                              : todo
                                ? "owed"
                                : "neutral"
                          }
                        >
                          {ob.status === "Draft"
                            ? "To complete"
                            : ob.status === "Submitted"
                              ? "Waiting for the builder"
                              : ob.status}
                        </Pill>
                        <Link
                          href={`/portal/onboarding/${pr.id}`}
                          className={`${btnLight} !px-3 !py-1.5 text-xs`}
                        >
                          {ob.status === "Draft"
                            ? "Complete onboarding"
                            : ob.status === "Declined"
                              ? "Correct and resend"
                              : "View"}
                        </Link>
                      </span>
                    </div>
                  );
                })()}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3">
                  {asked ? (
                    <Pill tone="owed">
                      Completion sent {fmtDate(asked.finishRequested!)}. Waiting for the builder
                    </Pill>
                  ) : (
                    <>
                      <span className="text-xs text-ink-soft">Finished your work here?</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Tell the builder your work on ${pr.name} is complete? They confirm it, and your crew come off the project. Everything you signed stays on record.`,
                            )
                          )
                            p.requestFinish(p.subId, pr.id);
                        }}
                        className={`${btnLight} !px-3 !py-1.5 text-xs`}
                      >
                        Mark my work complete
                      </button>
                    </>
                  )}
                </div>
                <div className="space-y-1.5 border-t border-line bg-tint/50 px-5 py-4 text-xs text-ink-soft">
                  <p>
                    <span className="font-semibold text-ink">Emergency contact:</span>{" "}
                    {pr.emergencyContact}
                  </p>
                  <p>
                    <span className="font-semibold text-ink">Assembly point:</span>{" "}
                    {pr.assembly}
                  </p>
                  <p>
                    <span className="font-semibold text-ink">Nearest hospital:</span>{" "}
                    {pr.hospital}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        !p.pending.length && (
          <Card>
            <EmptyState
              title="No projects yet"
              body="Ask your builder to invite you from their dashboard. Invitations appear here."
            />
          </Card>
        )
      )}

      {finished.length > 0 && (
        <Card className="mt-6">
          <CardHead
            title="Completed jobs"
            sub="Work you finished. Stored for your records, and the builder keeps everything you signed."
          />
          <ul className="divide-y divide-line">
            {finished.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 text-sm">
                <span className="font-semibold">
                  {p.projects.find((x) => x.id === i.projectId)?.name}
                  <span className="font-normal text-ink-soft"> · {i.from}</span>
                </span>
                <Pill tone="ok">Completed{i.finishedAt ? ` ${fmtDate(i.finishedAt)}` : ""}</Pill>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {removed.length > 0 && (
        <Card className="mt-6">
          <CardHead
            title="No longer on"
            sub="The builder has taken you off these projects. Your signed records stay with them."
          />
          <ul className="divide-y divide-line">
            {removed.map((i) => (
              <li key={i.id} className="px-5 py-3.5 text-sm font-semibold">
                {p.projects.find((x) => x.id === i.projectId)?.name}
                <span className="font-normal text-ink-soft"> · {i.from}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {past.length > 0 && (
        <p className="mt-6 text-sm text-ink-soft">
          You declined {past.length} invitation{past.length === 1 ? "" : "s"}.
        </p>
      )}
    </>
  );
}
