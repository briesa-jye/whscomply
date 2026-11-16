"use client";

import { Invites } from "@/components/portal/Invites";
import { usePortal } from "@/components/portal/usePortal";
import { Card, CardHead, EmptyState, PageHeading, Pill } from "@/components/app/ui";
import { fmtDate } from "@/lib/format";

export default function PortalProjects() {
  const p = usePortal();
  const past = p.myInvites.filter((i) => i.status === "Declined");
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

      {past.length > 0 && (
        <p className="mt-6 text-sm text-ink-soft">
          You declined {past.length} invitation{past.length === 1 ? "" : "s"}.
        </p>
      )}
    </>
  );
}
