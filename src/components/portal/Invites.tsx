"use client";

import { fmtDate } from "@/lib/format";
import { btnDark, btnLight, Card, CardHead } from "../app/ui";
import { usePortal } from "./usePortal";

/** Invitations from builders. Accepting one adds the project to this subcontractor. */
export function Invites() {
  const { pending, projects, respondInvite } = usePortal();
  if (!pending.length) return null;
  return (
    <Card className="mb-6 border-accent">
      <CardHead
        title={`${pending.length} invitation${pending.length === 1 ? "" : "s"} to work on a project`}
        sub="Accept to see the project, sign its SWMS and add your crew"
      />
      <ul className="divide-y divide-line">
        {pending.map((i) => {
          const proj = projects.find((x) => x.id === i.projectId);
          return (
            <li
              key={i.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
            >
              <div className="min-w-0">
                <p className="font-semibold">
                  {i.from} invited you to {proj?.name ?? "a project"}
                </p>
                <p className="text-sm text-ink-soft">
                  {proj?.address} · {proj?.stage} · from {i.by},{" "}
                  {fmtDate(i.date)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => respondInvite(i.id, false)}
                  className={btnLight}
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={() => respondInvite(i.id, true)}
                  className={btnDark}
                >
                  Accept
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
