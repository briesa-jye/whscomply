"use client";

import { useState, type FormEvent } from "react";
import { usePortal } from "@/components/portal/usePortal";
import { btnDark, Card, CardHead, EmptyState, Field, field, PageHeading, Pill } from "@/components/app/ui";
import type { IncidentType, RiskLevel } from "@/lib/data";
import { fmtDate, nowLocal, todayISO } from "@/lib/format";

const TYPES: IncidentType[] = [
  "Near miss",
  "Hazard",
  "First aid",
  "Injury",
  "Property damage",
  "Dangerous incident",
];
const LEVELS: RiskLevel[] = ["Low", "Medium", "High", "Extreme"];

export default function PortalReport() {
  const p = usePortal();
  const [sent, setSent] = useState(false);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = new FormData(form);
    const g = (k: string) => String(d.get(k) ?? "").trim();
    p.reportIncident({
      projectId: g("projectId"),
      type: g("type") as IncidentType,
      title: g("title"),
      date: todayISO(),
      time: nowLocal().slice(11),
      location: g("location"),
      reporter: p.sub
        ? `${p.sub.contact || "Site contact"}, ${p.sub.name}`
        : "Subcontractor",
      people: g("people"),
      description: g("description"),
      severity: g("severity") as RiskLevel,
    });
    form.reset();
    setSent(true);
    window.setTimeout(() => setSent(false), 4000);
  }

  return (
    <>
      <PageHeading
        title="Report an incident"
        sub="Tell the builder straight away about an injury, a near miss or a hazard on their site."
      />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHead title="New report" sub="Goes straight to the site manager" />
          {p.myProjects.length ? (
            <form onSubmit={submit} className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Project">
                <select name="projectId" required className={field}>
                  {p.myProjects.map((pr) => (
                    <option key={pr.id} value={pr.id}>
                      {pr.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="What happened">
                <select name="type" className={field}>
                  {TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Short title" className="sm:col-span-2">
                <input name="title" required className={field} />
              </Field>
              <Field label="Where on site">
                <input name="location" required className={field} />
              </Field>
              <Field label="How serious">
                <select name="severity" defaultValue="Medium" className={field}>
                  {LEVELS.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </Field>
              <Field label="People involved" hint="optional" className="sm:col-span-2">
                <input name="people" className={field} />
              </Field>
              <Field label="Description" className="sm:col-span-2">
                <textarea name="description" required rows={4} className={field} />
              </Field>
              <div className="flex items-center gap-3 sm:col-span-2">
                <button type="submit" className={btnDark}>
                  Send report
                </button>
                {sent && (
                  <span role="status" className="text-sm text-ink-soft">
                    Sent to the site manager
                  </span>
                )}
              </div>
            </form>
          ) : (
            <EmptyState
              title="No projects yet"
              body="Accept an invitation to a project before reporting on it."
            />
          )}
        </Card>

        <Card>
          <CardHead title="Your reports" />
          {p.myIncidents.length ? (
            <ul className="divide-y divide-line">
              {p.myIncidents.map((i) => (
                <li key={i.id} className="px-5 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold">{i.title}</p>
                    <Pill tone={i.status === "Closed" ? "ok" : "owed"}>{i.status}</Pill>
                  </div>
                  <p className="text-xs text-ink-soft">
                    {i.type} · {p.projects.find((x) => x.id === i.projectId)?.name} ·{" "}
                    {fmtDate(i.date)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No reports yet" />
          )}
        </Card>
      </div>
    </>
  );
}
