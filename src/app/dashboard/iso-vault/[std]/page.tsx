"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icons";
import { useIso } from "@/components/iso/useIso";
import { btnDark, btnLight, Card, EmptyState, PageHeading, Pill, Progress, Segmented } from "@/components/app/ui";
import { CATALOGUE, coverage, docNumber } from "@/lib/iso/catalogue";
import { download, fileSafe, wordHtml } from "@/lib/iso/markdown";
import { isStd, STANDARDS } from "@/lib/iso/standards";
import { docKey, type DocKind, type IsoStd } from "@/lib/iso/types";
import { fmtDate } from "@/lib/format";

const KINDS: DocKind[] = ["Manual", "Policy", "Procedure", "Plan", "Register", "Form"];
const TABS = ["Documents", "Clause coverage"] as const;

export default function IsoStandard() {
  const { std } = useParams<{ std: string }>();
  const v = useIso();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Documents");

  if (!isStd(std))
    return (
      <Card>
        <EmptyState title="That standard is not in the vault." action={<Link href="/dashboard/iso-vault" className={btnDark}>Back to ISO Vault</Link>} />
      </Card>
    );
  if (!v.ready) return <p className="py-10 text-center text-sm text-ink-soft">Loading the vault</p>;

  const m = STANDARDS[std];
  const sd: IsoStd = std;
  const st = v.stats(std);
  const list = CATALOGUE[std];
  const missing = list.length - st.generated;
  const busy = v.busy !== null;

  function compile() {
    const parts = list
      .map((d) => v.iso.docs[docKey(sd, d.id)])
      .map((d, i) => (d ? `${i ? '\n\n<hr>\n\n' : ""}${d.content}` : ""))
      .filter(Boolean);
    const cover = `# ${v.iso.profile.company || "Business"}: ${m.name} documentation set\n\n**Compiled ${fmtDate(new Date().toISOString().slice(0, 10))}. ${st.generated} documents, ${st.approved} approved.**\n\n## Contents\n\n${list
      .filter((d) => v.iso.docs[docKey(sd, d.id)])
      .map((d) => `- ${docNumber(sd, d.id)} ${d.title}`)
      .join("\n")}\n\n---\n\n`;
    download(`${fileSafe(v.iso.profile.company || "business")}-${m.short.replace(" ", "")}-manual.doc`, "application/msword", wordHtml(`${m.name} documentation set`, cover + parts.join("\n\n---\n\n")));
  }

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/dashboard/iso-vault" className="inline-flex items-center gap-1 text-ink-soft hover:text-ink">
          <Icon name="arrow" className="h-4 w-4 rotate-180" /> ISO Vault
        </Link>
      </p>
      <PageHeading
        title={m.name}
        sub={`${m.topic}. ${st.approved} of ${st.total} approved, ${st.generated} generated.`}
        actions={
          <>
            {busy ? (
              <button type="button" onClick={v.stop} className={btnLight}>
                Stop
              </button>
            ) : (
              <button type="button" disabled={!missing} onClick={() => v.generateAll(std)} className={`${btnDark} disabled:opacity-40`}>
                <Icon name="sparkle" className="h-4 w-4" />
                {missing ? `Generate ${missing === list.length ? "all" : `remaining ${missing}`}` : "All generated"}
              </button>
            )}
            <button type="button" disabled={!st.generated} onClick={compile} className={`${btnLight} disabled:opacity-40`}>
              <Icon name="download" className="h-4 w-4" /> Download manual
            </button>
          </>
        }
      />

      {(v.queue || v.note) && (
        <div role="status" className="mb-4 rounded-xl border border-line bg-tint/60 px-4 py-3 text-sm">
          {v.queue ? `Writing document ${v.queue.done + 1} of ${v.queue.total}. You can leave this page open and keep working.` : v.note}
        </div>
      )}
      {!v.iso.profile.scope && (
        <div className="mb-4 rounded-xl border border-accent bg-accent/10 px-4 py-3 text-sm">
          Add your business details first so the documents are specific to you.{" "}
          <Link href="/dashboard/iso-vault" className="font-semibold underline">Go to your business details</Link>
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-line bg-surface p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold">Required documents approved</span>
          <span className="tabular-nums text-ink-soft">{st.mandatoryApproved} of {st.mandatory}</span>
        </div>
        <Progress pct={st.mandatory ? Math.round((st.mandatoryApproved / st.mandatory) * 100) : 0} />
      </div>

      <div className="mb-4">
        <Segmented label="View" value={tab} options={TABS.map((t) => ({ value: t, label: t }))} onChange={setTab} />
      </div>

      {tab === "Documents" ? (
        <div className="space-y-6">
          {KINDS.map((kind) => {
            const rows = list.filter((d) => d.kind === kind);
            if (!rows.length) return null;
            return (
              <section key={kind}>
                <h2 className="mb-2 font-mono text-[11px] uppercase tracking-widest text-ink-soft">
                  {kind === "Policy" ? "Policies" : kind === "Procedure" ? "Procedures" : kind === "Plan" ? "Plans" : kind === "Register" ? "Registers" : kind === "Form" ? "Forms and checklists" : "Manuals"}
                </h2>
                <Card>
                  <ul className="divide-y divide-line">
                    {rows.map((d) => {
                      const key = docKey(std, d.id);
                      const doc = v.iso.docs[key];
                      const working = v.busy === key;
                      return (
                        <li key={d.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                          <Link href={`/dashboard/iso-vault/${std}/${d.id}`} className="min-w-0 flex-1">
                            <p className="font-semibold">
                              <span className="mr-2 font-mono text-xs text-ink-soft">{docNumber(std, d.id)}</span>
                              {d.title}
                            </p>
                            <p className="text-xs text-ink-soft">
                              Clause {d.clauses.join(", ")}
                              {doc && ` · version ${doc.version} · ${doc.source === "AI" ? "written by AI" : "built-in draft"}`}
                            </p>
                          </Link>
                          {d.mandatory && <Pill tone="neutral">Required</Pill>}
                          {working ? (
                            <Pill tone="owed">Writing</Pill>
                          ) : doc ? (
                            <Pill tone={doc.status === "Approved" ? "ok" : "owed"}>{doc.status === "Approved" ? "Approved" : "Draft"}</Pill>
                          ) : (
                            <Pill>Not generated</Pill>
                          )}
                          {!doc && !busy && (
                            <button type="button" onClick={() => v.generate(std, d)} className={`${btnLight} !px-3 !py-1.5 text-xs`}>
                              Generate
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              </section>
            );
          })}
        </div>
      ) : (
        <Card>
          <ul className="divide-y divide-line">
            {coverage(std).map((c) => {
              const covered = c.docs.length > 0;
              const approved = c.docs.filter((d) => v.iso.docs[docKey(std, d.id)]?.status === "Approved").length;
              return (
                <li key={c.clause} className="px-5 py-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">
                      <span className="mr-2 font-mono text-xs text-ink-soft">{c.clause}</span>
                      {c.title}
                    </p>
                    <Pill tone={approved && approved === c.docs.length ? "ok" : covered ? "owed" : "neutral"}>
                      {covered ? `${approved} of ${c.docs.length} approved` : "Met by records, not a document"}
                    </Pill>
                  </div>
                  <p className="mt-1 text-xs text-ink-soft">Auditor asks: {c.q}</p>
                  {covered && (
                    <p className="mt-1 flex flex-wrap gap-x-3 text-xs">
                      {c.docs.map((d) => (
                        <Link key={d.id} href={`/dashboard/iso-vault/${std}/${d.id}`} className="underline">
                          {docNumber(std, d.id)} {d.title}
                        </Link>
                      ))}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </>
  );
}
