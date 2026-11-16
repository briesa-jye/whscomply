"use client";

import { useState } from "react";
import { Actions, fd, Shell, TicketForm } from "@/components/app/forms";
import { ExpiryPill } from "@/components/portal/ExpiryPill";
import { usePortal } from "@/components/portal/usePortal";
import { btnDark, btnLight, Card, EmptyState, Field, field, PageHeading, Pill } from "@/components/app/ui";

export default function PortalCrew() {
  const p = usePortal();
  const [adding, setAdding] = useState(false);
  const [ticketFor, setTicketFor] = useState<string | null>(null);
  const forWorker = p.crew.find((w) => w.id === ticketFor);

  return (
    <>
      <PageHeading
        title="My crew"
        sub="Your workers, their tickets and which sites they are inducted to."
        actions={
          <button type="button" onClick={() => setAdding(true)} className={btnDark}>
            Add a worker
          </button>
        }
      />

      {p.crew.length ? (
        <div className="grid gap-6 md:grid-cols-2">
          {p.crew.map((w) => (
            <Card key={w.id}>
              <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
                <div className="min-w-0">
                  <h2 className="font-display text-base font-extrabold tracking-tight">
                    {w.name}
                  </h2>
                  <p className="text-xs text-ink-soft">
                    {w.role}
                    {w.phone && ` · ${w.phone}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTicketFor(w.id)}
                  className={btnLight}
                >
                  Add ticket
                </button>
              </div>
              {w.tickets.length ? (
                <ul className="divide-y divide-line">
                  {w.tickets.map((t) => (
                    <li
                      key={t.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm"
                    >
                      <span className="min-w-0">
                        <span className="block font-semibold">{t.kind}</span>
                        <span className="block text-xs text-ink-soft">{t.number}</span>
                      </span>
                      <ExpiryPill expires={t.expires} warn={p.warn} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-4 text-sm text-ink-soft">
                  No tickets on file. Add the white card first.
                </p>
              )}
              <div className="flex flex-wrap gap-2 border-t border-line bg-tint/50 px-5 py-3">
                {p.myProjects
                  .filter((pr) => w.projects.includes(pr.id))
                  .map((pr) => (
                    <span key={pr.id} className="inline-flex items-center gap-1.5">
                      <span className="text-xs text-ink-soft">{pr.name}</span>
                      {w.inducted.includes(pr.id) ? (
                        <Pill tone="ok">Inducted</Pill>
                      ) : (
                        <Pill tone="owed">Not inducted</Pill>
                      )}
                    </span>
                  ))}
                {!w.projects.some((id) => p.projectIds.has(id)) && (
                  <span className="text-xs text-ink-soft">
                    Not assigned to a project yet
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            title="No workers yet"
            body="Add the people who will work on site, with their white card and licences."
          />
        </Card>
      )}

      {adding && (
        <Shell
          title="Add a worker"
          sub="You can add their tickets afterwards"
          onClose={() => setAdding(false)}
        >
          <form
            onSubmit={(e) => {
              const g = fd(e);
              p.addWorker({
                name: g("name"),
                role: g("role"),
                company: p.subId,
                phone: g("phone"),
                projects: p.myProjects
                  .filter((pr) => g(`p-${pr.id}`) === "on")
                  .map((pr) => pr.id),
              });
              setAdding(false);
            }}
            className="grid gap-4 sm:grid-cols-2"
          >
            <Field label="Full name">
              <input name="name" required className={field} />
            </Field>
            <Field label="Role or trade">
              <input name="role" required className={field} />
            </Field>
            <Field label="Mobile" hint="optional" className="sm:col-span-2">
              <input name="phone" className={field} />
            </Field>
            {p.myProjects.length > 0 && (
              <fieldset className="sm:col-span-2">
                <legend className="text-sm font-medium">Working on</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {p.myProjects.map((pr) => (
                    <label
                      key={pr.id}
                      className="flex cursor-pointer items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm has-[:checked]:border-ink has-[:checked]:bg-tint"
                    >
                      <input
                        type="checkbox"
                        name={`p-${pr.id}`}
                        defaultChecked
                        className="accent-[var(--ink)]"
                      />
                      {pr.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <div className="sm:col-span-2">
              <Actions onClose={() => setAdding(false)} submit="Add worker" />
            </div>
          </form>
        </Shell>
      )}

      {forWorker && (
        <TicketForm
          name={forWorker.name}
          onClose={() => setTicketFor(null)}
          onSave={(t) => p.addTicket(forWorker.id, t)}
        />
      )}
    </>
  );
}
