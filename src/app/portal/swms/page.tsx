"use client";

import { usePortal } from "@/components/portal/usePortal";
import { btnDark, Card, EmptyState, PageHeading, Pill, RiskPill } from "@/components/app/ui";
import { fmtDate } from "@/lib/format";

export default function PortalSwms() {
  const p = usePortal();
  return (
    <>
      <PageHeading
        title="SWMS to sign"
        sub="Read each safe work method statement, then sign for each of your crew who will do the work."
      />
      {p.mySwms.length ? (
        <div className="space-y-4">
          {p.mySwms.map((x) => {
            const proj = p.projects.find((pr) => pr.id === x.projectId);
            const mine = p.crew.filter((w) => x.required.includes(w.id));
            const todo = mine.filter((w) => !x.signed.includes(w.id));
            return (
              <Card key={x.id}>
                <details className="group" open={todo.length > 0}>
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <p className="font-display text-base font-extrabold tracking-tight">
                        {x.title}
                      </p>
                      <p className="text-xs text-ink-soft">
                        {proj?.name} · version {x.version} · updated{" "}
                        {fmtDate(x.updated)}
                        {x.highRisk && " · High risk work"}
                      </p>
                    </div>
                    <Pill tone={todo.length ? "owed" : "ok"}>
                      {todo.length ? `${todo.length} to sign` : "All signed"}
                    </Pill>
                  </summary>

                  <div className="border-t border-line">
                    <ol className="divide-y divide-line">
                      {x.steps.map((st, i) => (
                        <li key={st.id} className="px-5 py-3.5 text-sm">
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-semibold">
                              {i + 1}. {st.task}
                            </p>
                            <RiskPill level={st.risk} />
                          </div>
                          <p className="mt-1 text-ink-soft">
                            <span className="font-semibold text-ink">Hazard:</span>{" "}
                            {st.hazard}
                          </p>
                          <p className="text-ink-soft">
                            <span className="font-semibold text-ink">Controls:</span>{" "}
                            {st.controls}
                          </p>
                        </li>
                      ))}
                    </ol>
                    <ul className="divide-y divide-line border-t border-line bg-tint/50">
                      {mine.map((w) => {
                        const signed = x.signed.includes(w.id);
                        return (
                          <li
                            key={w.id}
                            className="flex items-center justify-between gap-3 px-5 py-3"
                          >
                            <span className="text-sm">
                              <span className="font-semibold">{w.name}</span>
                              <span className="text-ink-soft"> · {w.role}</span>
                            </span>
                            {signed ? (
                              <Pill tone="ok">Signed</Pill>
                            ) : (
                              <button
                                type="button"
                                onClick={() => p.signSwms(x.id, w.id)}
                                className={btnDark}
                              >
                                Read and sign
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </details>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            title="Nothing to sign"
            body="SWMS your builders need from your crew appear here once you have accepted a project and added workers."
          />
        </Card>
      )}
    </>
  );
}
