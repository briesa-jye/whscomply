"use client";

import { usePortal } from "@/components/portal/usePortal";
import { btnDark, btnLight, Card, EmptyState, PageHeading, Pill, RiskPill } from "@/components/app/ui";
import { fmtDate } from "@/lib/format";
import type { Swms } from "@/lib/data";

export default function PortalSwms() {
  const p = usePortal();
  const crewIds = new Set(p.crew.map((w) => w.id));
  const isRequired = (x: Swms) => x.required.some((w) => crewIds.has(w));
  const required = p.mySwms.filter(isRequired);
  // Others on the same projects: the crew assigned there can still sign on to them.
  const other = p.mySwms.filter(
    (x) => !isRequired(x) && p.crew.some((w) => w.projects.includes(x.projectId)),
  );

  const card = (x: Swms, req: boolean) => {
    const proj = p.projects.find((pr) => pr.id === x.projectId);
    const mine = req
      ? p.crew.filter((w) => x.required.includes(w.id))
      : p.crew.filter((w) => w.projects.includes(x.projectId));
    const todo = mine.filter((w) => !x.signed.includes(w.id));
    return (
      <Card key={x.id}>
        <details className="group" open={req && todo.length > 0}>
          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div className="min-w-0">
              <p className="font-display text-base font-extrabold tracking-tight">
                {x.title}
              </p>
              <p className="text-xs text-ink-soft">
                {proj?.name} · version {x.version} · updated {fmtDate(x.updated)}
                {x.highRisk && " · High risk work"}
              </p>
            </div>
            {req ? (
              <Pill tone={todo.length ? "owed" : "ok"}>
                {todo.length ? `${todo.length} to sign` : "All signed"}
              </Pill>
            ) : (
              <Pill>Not required of your crew</Pill>
            )}
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
                        className={req ? btnDark : btnLight}
                      >
                        {req ? "Read and sign" : "Sign on"}
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
  };

  return (
    <>
      <PageHeading
        title="SWMS to sign"
        sub="Read each safe work method statement, then sign for each of your crew who will do the work. The builder sees every signature."
      />
      {required.length || other.length ? (
        <div className="space-y-8">
          {required.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-mono text-[11px] uppercase tracking-widest text-ink-soft">
                Required of your crew
              </h2>
              {required.map((x) => card(x, true))}
            </section>
          )}
          {other.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-mono text-[11px] uppercase tracking-widest text-ink-soft">
                Other SWMS on your projects
              </h2>
              {other.map((x) => card(x, false))}
            </section>
          )}
        </div>
      ) : (
        <Card>
          <EmptyState
            title="Nothing to sign"
            body="SWMS on your projects appear here once you have accepted an invitation and added workers to the project."
          />
        </Card>
      )}
    </>
  );
}
