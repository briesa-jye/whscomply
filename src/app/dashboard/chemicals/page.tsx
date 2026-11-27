"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icons";
import { useScope } from "@/components/app/DemoStore";
import { DateModal } from "@/components/app/forms2";
import { AttachField } from "@/components/app/Attachments";
import {
  btnDark,
  btnLight,
  Card,
  Chips,
  EmptyState,
  PageHeading,
  Pill,
} from "@/components/app/ui";
import { daysUntil, type Chemical } from "@/lib/data";
import { fmtDate, todayISO } from "@/lib/format";

const FILTERS = ["In use", "Needs attention", "Removed", "All"] as const;

const needsAttention = (c: Chemical) =>
  c.status === "In use" &&
  (!c.hasSds || (c.sdsDate !== null && daysUntil(c.sdsDate) < -1825));

export default function ChemicalsPage() {
  const s = useScope();
  const [f, setF] = useState<(typeof FILTERS)[number]>("In use");
  const [q, setQ] = useState("");
  const [sdsFor, setSdsFor] = useState<Chemical | null>(null);

  const waiting = s.siteOnboardings.filter(
    (o) => o.status === "Submitted" && (s.all || o.projectId === s.scopeId),
  ).length;
  const list = s.chemicalsIn.filter(
    (c) =>
      `${c.name} ${c.supplier} ${c.hazard}`
        .toLowerCase()
        .includes(q.toLowerCase()) &&
      (f === "All" ||
        (f === "Needs attention" ? needsAttention(c) : c.status === f)),
  );

  return (
    <>
      <PageHeading
        title="Hazardous chemicals"
        sub="Every hazardous chemical on site, where it is kept and its safety data sheet. SDSs must be current, and no more than five years old."
        actions={
          <Link href="/dashboard/chemicals/new" className={btnDark}>
            <Icon name="plus" className="h-4 w-4" /> Add chemical
          </Link>
        }
      />
      {waiting > 0 && (
        <Link
          href="/dashboard/chemicals/onboarding"
          className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-accent/15 px-4 py-3 text-sm font-medium"
        >
          <span>
            {waiting} subcontractor onboarding{waiting === 1 ? "" : "s"} with SWMS
            and SDS waiting for approval.
          </span>
          <span className="font-semibold underline">Review</span>
        </Link>
      )}
      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-3">
          <label className="flex min-w-[12rem] flex-1 items-center gap-2 rounded-full bg-bg px-3 py-2 text-sm text-ink-soft focus-within:ring-2 focus-within:ring-accent">
            <Icon name="search" className="h-4 w-4" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search product, supplier or hazard"
              aria-label="Search chemicals"
              className="w-full bg-transparent text-ink outline-none placeholder:text-ink-soft"
            />
          </label>
          <Chips value={f} options={[...FILTERS]} onChange={setF} />
        </div>
        {list.length === 0 ? (
          <EmptyState
            title="No chemicals here."
            body="Add what is stored on site so the SDS register stays current."
          />
        ) : (
          <ul>
            {list.map((c) => {
              const old = c.sdsDate !== null && daysUntil(c.sdsDate) < -1825;
              const bad = needsAttention(c);
              return (
                <li
                  key={c.id}
                  className={`border-b border-line px-5 py-4 last:border-0 ${bad ? "bg-accent/[0.07] shadow-[inset_3px_0_0_var(--accent)]" : ""}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{c.name}</p>
                      <p className="text-xs text-ink-soft">
                        {s.all &&
                          `${s.projects.find((x) => x.id === c.projectId)?.name} · `}
                        {c.supplier} · {c.quantity} · {c.location}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Pill tone="neutral">{c.hazard}</Pill>
                      {c.ownerId && (
                        <Pill tone="neutral">
                          {s.subs.find((x) => x.id === c.ownerId)?.name ??
                            "Contractor"}
                        </Pill>
                      )}
                      <Pill tone={!c.hasSds || old ? "owed" : "ok"}>
                        {!c.hasSds
                          ? "SDS missing"
                          : old
                            ? "SDS over 5 years old"
                            : `SDS ${fmtDate(c.sdsDate ?? "")}`}
                      </Pill>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-ink-soft">{c.controls}</p>
                  <div className="mt-3">
                    <AttachField
                      files={c.files ?? []}
                      onChange={(files) => s.updateChemical(c.id, { files })}
                      label="Attach the SDS"
                      accept="image/*,.pdf"
                      disabled={c.status === "Removed"}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {c.status === "In use" && (
                      <>
                        <button
                          type="button"
                          onClick={() => setSdsFor(c)}
                          className={`${btnLight} !px-3 !py-1.5 text-xs`}
                        >
                          {c.hasSds ? "Record new SDS" : "Record SDS received"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            s.updateChemical(c.id, { status: "Removed" })
                          }
                          className={`${btnLight} !px-3 !py-1.5 text-xs`}
                        >
                          Removed from site
                        </button>
                      </>
                    )}
                    {c.status === "Removed" && (
                      <Pill tone="neutral">Removed from site</Pill>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      {sdsFor && (
        <DateModal
          title={`Safety data sheet: ${sdsFor.name}`}
          label="SDS issue date"
          sub="Request a current SDS from the supplier"
          initial={todayISO()}
          submit="Save"
          onClose={() => setSdsFor(null)}
          onSave={(d) =>
            s.updateChemical(sdsFor.id, { hasSds: true, sdsDate: d })
          }
        />
      )}
    </>
  );
}
