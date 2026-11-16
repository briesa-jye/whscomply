"use client";

import { usePortal } from "@/components/portal/usePortal";
import { Card, EmptyState, PageHeading, Pill } from "@/components/app/ui";
import { daysUntil } from "@/lib/data";
import { fmtDate } from "@/lib/format";

export default function PortalActions() {
  const p = usePortal();
  return (
    <>
      <PageHeading
        title="Actions"
        sub="Corrective actions a builder has assigned to you or your crew. Tick them off when done."
      />
      <Card>
        {p.myActions.length ? (
          <ul className="divide-y divide-line">
            {p.myActions.map((a) => {
              const done = a.status === "Done";
              const late = !done && daysUntil(a.due) < 0;
              return (
                <li key={a.id} className="flex items-center gap-4 px-5 py-4">
                  <button
                    type="button"
                    onClick={() => p.toggleAction(a.id)}
                    aria-label={done ? "Mark as open" : "Mark as done"}
                    aria-pressed={done}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                      done ? "border-ink bg-ink text-bg" : "border-line"
                    }`}
                  >
                    {done && "✓"}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`font-semibold ${done ? "text-ink-soft line-through" : ""}`}>
                      {a.title}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {p.projects.find((x) => x.id === a.projectId)?.name} · {a.owner} ·
                      due {fmtDate(a.due)}
                    </p>
                  </div>
                  <Pill tone={done ? "ok" : late ? "owed" : "neutral"}>
                    {done ? "Done" : late ? "Overdue" : "Open"}
                  </Pill>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            title="No actions"
            body="Nothing has been assigned to you."
          />
        )}
      </Card>
    </>
  );
}
