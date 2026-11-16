"use client";

import { useState } from "react";
import { DocForm } from "@/components/app/forms";
import { ExpiryPill } from "@/components/portal/ExpiryPill";
import { usePortal } from "@/components/portal/usePortal";
import { btnDark, Card, CardHead, EmptyState, PageHeading, Pill } from "@/components/app/ui";

export default function PortalCompliance() {
  const p = usePortal();
  const [adding, setAdding] = useState(false);
  const prequal = p.sub?.prequal ?? [];

  return (
    <>
      <PageHeading
        title="My compliance"
        sub="Your insurances, licences and policies. Keep them current once and every builder you work for can see them."
        actions={
          <button type="button" onClick={() => setAdding(true)} className={btnDark}>
            Add a document
          </button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-5">
        <Pill tone={p.sub?.approved ? "ok" : "owed"}>
          {p.sub?.approved ? "Approved subcontractor" : "Awaiting approval"}
        </Pill>
        <p className="text-sm text-ink-soft">
          {p.sub?.approved
            ? "Your builders have approved you to work on their sites."
            : "A builder approves you once your insurance and prequalification are in."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHead title="Documents" sub="Insurance, WorkCover, licences and policies" />
          {p.docs.length ? (
            <ul className="divide-y divide-line">
              {p.docs.map((d) => (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
                >
                  <span className="font-semibold">{d.kind}</span>
                  <span className="flex items-center gap-3">
                    <ExpiryPill expires={d.expires} warn={p.warn} />
                    <button
                      type="button"
                      onClick={() => p.removeDoc(p.subId, d.id)}
                      className="text-xs font-semibold text-ink-soft hover:text-ink"
                    >
                      Remove
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No documents yet"
              body="Add your public liability insurance and workers' compensation first."
            />
          )}
        </Card>

        <Card>
          <CardHead title="Prequalification" sub="Checks a builder asks for" />
          {prequal.length ? (
            <ul className="divide-y divide-line">
              {prequal.map((q) => (
                <li key={q.id} className="flex items-start justify-between gap-3 px-5 py-3.5 text-sm">
                  <span>{q.text}</span>
                  <Pill tone={q.done ? "ok" : "owed"}>{q.done ? "Done" : "Open"}</Pill>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Nothing requested"
              body="If a builder asks for prequalification checks, they appear here."
            />
          )}
        </Card>
      </div>

      {adding && (
        <DocForm
          name={p.sub?.name ?? "your business"}
          onClose={() => setAdding(false)}
          onSave={(d) => p.addDoc(p.subId, d)}
        />
      )}
    </>
  );
}
