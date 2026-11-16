"use client";

import Link from "next/link";
import { Invites } from "@/components/portal/Invites";
import { usePortal } from "@/components/portal/usePortal";
import { Card, CardHead, EmptyState, PageHeading, Pill, Stat } from "@/components/app/ui";
import { daysUntil, expiryOf } from "@/lib/data";
import { fmtDate } from "@/lib/format";

const left = (iso: string | null) => {
  if (!iso) return "No expiry";
  const d = daysUntil(iso);
  return d < 0 ? `Expired ${-d} days ago` : `Expires in ${d} days`;
};

export default function PortalOverview() {
  const p = usePortal();
  const todo: { key: string; text: string; sub: string; href: string }[] = [
    ...p.unsigned.map((u) => ({
      key: `s-${u.swms.id}-${u.worker.id}`,
      text: `${u.worker.name} has not signed ${u.swms.title}`,
      sub: `${p.projects.find((x) => x.id === u.swms.projectId)?.name} · version ${u.swms.version}`,
      href: "/portal/swms",
    })),
    ...p.docsDue.map((d) => ({
      key: `d-${d.id}`,
      text: `${d.kind} ${expiryOf(d.expires, p.warn) === "expired" ? "has expired" : "is due to expire"}`,
      sub: left(d.expires),
      href: "/portal/compliance",
    })),
    ...p.ticketsDue.map(({ worker, ticket }) => ({
      key: `t-${ticket.id}`,
      text: `${worker.name}: ${ticket.kind}`,
      sub: left(ticket.expires),
      href: "/portal/crew",
    })),
    ...p.uninducted.map(({ worker, project }) => ({
      key: `i-${worker.id}-${project.id}`,
      text: `${worker.name} is not inducted to ${project.name}`,
      sub: "Needs the site induction before starting",
      href: "/portal/crew",
    })),
    ...p.openActions.map((a) => ({
      key: `a-${a.id}`,
      text: a.title,
      sub: `Corrective action · due ${fmtDate(a.due)}`,
      href: "/portal/actions",
    })),
  ];

  return (
    <>
      <PageHeading
        title={`Hello, ${p.sub?.contact?.split(" ")[0] || "there"}`}
        sub={`${p.sub?.name ?? ""} · what needs doing across the projects you were invited to`}
      />

      <Invites />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Projects" value={String(p.myProjects.length)} note="You were invited to" />
        <Stat
          label="SWMS to sign"
          value={String(p.unsigned.length)}
          note={p.unsigned.length ? "Crew yet to sign" : "All signed"}
          tone={p.unsigned.length ? "owed" : undefined}
        />
        <Stat
          label="Tickets and documents due"
          value={String(p.docsDue.length + p.ticketsDue.length)}
          note="Expired or expiring soon"
          tone={p.docsDue.length + p.ticketsDue.length ? "owed" : undefined}
        />
        <Stat
          label="Open actions"
          value={String(p.openActions.length)}
          note="Assigned to your crew"
          tone={p.openActions.length ? "owed" : undefined}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHead title="Needs your attention" sub="Clear these before you start work" />
          {todo.length ? (
            <ul className="divide-y divide-line">
              {todo.slice(0, 10).map((t) => (
                <li key={t.key}>
                  <Link
                    href={t.href}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-tint/60"
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold">{t.text}</span>
                      <span className="block text-xs text-ink-soft">{t.sub}</span>
                    </span>
                    <Pill tone="owed">To do</Pill>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="You are all clear"
              body="Everything is signed, current and inducted."
            />
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHead title="My projects" />
            {p.myProjects.length ? (
              <ul className="divide-y divide-line">
                {p.myProjects.map((pr) => (
                  <li key={pr.id} className="px-5 py-3.5">
                    <p className="font-semibold">{pr.name}</p>
                    <p className="text-xs text-ink-soft">
                      {pr.stage} · Site manager {pr.manager}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No projects yet"
                body="When a builder invites you, the project shows up here."
              />
            )}
          </Card>

          <Card>
            <CardHead title="Site notices" sub="From your builders" />
            {p.myNotices.length ? (
              <ul className="divide-y divide-line">
                {p.myNotices.slice(0, 3).map((n) => (
                  <li key={n.id} className="px-5 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold">{n.title}</p>
                      <Pill tone={n.priority === "Safety alert" ? "owed" : "neutral"}>
                        {n.priority}
                      </Pill>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{n.body}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No notices" />
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
