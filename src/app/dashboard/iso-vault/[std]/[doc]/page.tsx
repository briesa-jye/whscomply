"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icons";
import { useIso } from "@/components/iso/useIso";
import { btnDark, btnLight, Card, EmptyState, Pill } from "@/components/app/ui";
import { PurchaseModal } from "@/components/iso/PurchaseModal";
import { WritingStage } from "@/components/iso/Forge";
import { docNumber, findDoc } from "@/lib/iso/catalogue";
import { download, fileSafe, mdToHtml, wordCount, wordHtml } from "@/lib/iso/markdown";
import { ISO_PRICE, isStd, money, STANDARDS } from "@/lib/iso/standards";
import { docKey } from "@/lib/iso/types";
import { me } from "@/lib/data";
import { fmtDate } from "@/lib/format";

export default function IsoDocument() {
  const { std, doc: docId } = useParams<{ std: string; doc: string }>();
  const v = useIso();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [buying, setBuying] = useState(false);

  const spec = isStd(std) ? findDoc(std, docId) : undefined;
  if (!v.ready) return <p className="py-10 text-center text-sm text-ink-soft">Loading the document</p>;
  if (!isStd(std) || !spec)
    return (
      <Card>
        <EmptyState title="That document was not found." action={<Link href="/dashboard/iso-vault" className={btnDark}>Back to ISO Vault</Link>} />
      </Card>
    );

  if (!v.unlocked(std))
    return (
      <>
        <p className="mb-2 text-sm">
          <Link href={`/dashboard/iso-vault/${std}`} className="inline-flex items-center gap-1 text-ink-soft hover:text-ink">
            <Icon name="arrow" className="h-4 w-4 rotate-180" /> {STANDARDS[std].name}
          </Link>
        </p>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{spec.title}</h1>
        <Card className="mt-4">
          <EmptyState
            title={`Unlock ${STANDARDS[std].name} to write this document`}
            body={`${spec.purpose.replace("{company}", v.iso.profile.company || "the business")} The whole set is ${money(ISO_PRICE)}, one-off.`}
            action={
              <button type="button" onClick={() => setBuying(true)} className={btnDark}>
                <Icon name="lock" className="h-4 w-4" /> Unlock for {money(ISO_PRICE)}
              </button>
            }
          />
        </Card>
        {buying && <PurchaseModal std={std} onClose={() => setBuying(false)} />}
      </>
    );

  const key = docKey(std, spec.id);
  const saved = v.iso.docs[key];
  const working = v.busy === key;
  const text = working ? v.partial : (saved?.content ?? "");
  const no = docNumber(std, spec.id);
  const base = `${no}-${fileSafe(spec.title)}`;

  function regenerate() {
    if (
      saved &&
      !window.confirm(
        "Write this document again? The current text is replaced by a new version, including any edits you made.",
      )
    )
      return;
    setEditing(false);
    v.generate(std as "9001", spec!);
  }

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href={`/dashboard/iso-vault/${std}`} className="inline-flex items-center gap-1 text-ink-soft hover:text-ink">
          <Icon name="arrow" className="h-4 w-4 rotate-180" /> {STANDARDS[std].name}
        </Link>
      </p>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-xs text-ink-soft">{no} · Clause {spec.clauses.join(", ")}</p>
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{spec.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {saved ? (
              <>
                <Pill tone={saved.status === "Approved" ? "ok" : "owed"}>{saved.status}</Pill>
                <Pill>Version {saved.version}</Pill>
                <Pill>{saved.source === "AI" ? "Written by AI" : "Built-in draft"}</Pill>
                <span className="text-xs text-ink-soft">
                  {wordCount(saved.content).toLocaleString("en-AU")} words
                  {saved.approvedAt && ` · approved ${fmtDate(saved.approvedAt)} by ${saved.approvedBy ?? me.name}`}
                </span>
              </>
            ) : (
              <Pill>Not generated</Pill>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {working ? (
            <button type="button" onClick={v.stop} className={btnLight}>Stop</button>
          ) : (
            <button type="button" onClick={regenerate} disabled={v.busy !== null} className={saved ? btnLight : btnDark}>
              <Icon name="sparkle" className="h-4 w-4" /> {saved ? "Write again" : "Generate"}
            </button>
          )}
          {saved && !working && (
            <>
              {editing ? (
                <>
                  <button type="button" onClick={() => setEditing(false)} className={btnLight}>Cancel</button>
                  <button
                    type="button"
                    onClick={() => {
                      v.saveIsoDoc(key, { ...saved, content: draft, status: "Draft" }, `edited ${no} ${spec.title}`);
                      setEditing(false);
                    }}
                    className={btnDark}
                  >
                    Save changes
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => { setDraft(saved.content); setEditing(true); }} className={btnLight}>
                  <Icon name="pencil" className="h-4 w-4" /> Edit
                </button>
              )}
              {saved.status !== "Approved" && !editing && (
                <button type="button" onClick={() => v.approve(std, spec)} className={btnDark}>
                  <Icon name="check" className="h-4 w-4" /> Approve
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {v.note && !working && <p role="status" className="mb-4 rounded-xl border border-line bg-tint/60 px-4 py-3 text-sm">{v.note}</p>}
      {saved?.status === "Approved" && (
        <p className="mb-4 rounded-xl border border-line bg-surface px-4 py-3 text-sm">
          Approved. Editing or writing it again returns it to draft until someone approves it again.
        </p>
      )}

      {working ? (
        <WritingStage title={spec.title} no={no} text={text} facts={v.facts} />
      ) : !saved ? (
        <Card>
          <EmptyState
            title="This document has not been written yet"
            body={spec.purpose.replace("{company}", v.iso.profile.company || "the business")}
            action={<button type="button" onClick={regenerate} className={btnDark}>Generate</button>}
          />
        </Card>
      ) : editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="Document text in Markdown"
          className="min-h-[70dvh] w-full rounded-2xl border border-line bg-surface p-4 font-mono text-[13px] leading-relaxed"
        />
      ) : (
        <>
          <article
            className="iso-doc rounded-2xl border border-line bg-surface p-5 sm:p-8"
            // The text is escaped by mdToHtml before any markup is added, so a document cannot inject HTML.
            dangerouslySetInnerHTML={{ __html: mdToHtml(text) }}
          />
        </>
      )}

      {saved && !working && !editing && (
        <div className="mt-4 flex flex-wrap gap-2 print:hidden">
          <button type="button" onClick={() => download(`${base}.doc`, "application/msword", wordHtml(spec.title, saved.content))} className={btnLight}>
            <Icon name="download" className="h-4 w-4" /> Word
          </button>
          <button type="button" onClick={() => download(`${base}.md`, "text/markdown", saved.content)} className={btnLight}>
            <Icon name="download" className="h-4 w-4" /> Markdown
          </button>
          <button type="button" onClick={() => window.print()} className={btnLight}>Print or save as PDF</button>
        </div>
      )}
    </>
  );
}
