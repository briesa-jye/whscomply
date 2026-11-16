"use client";

import { useState } from "react";
import { Icon } from "../Icons";
import { useStore } from "./DemoStore";
import { Modal } from "./Modal";
import { btnDark, btnLight, Field, field } from "./ui";

/** Close a project and store it. Shows what is still open so nothing is closed by accident, and what closing does. */
export function CloseProjectModal({
  projectId,
  onClose,
}: {
  projectId: string;
  onClose: () => void;
}) {
  const s = useStore();
  const [note, setNote] = useState("");
  const p = s.projects.find((x) => x.id === projectId);
  if (!p) return null;

  const open = [
    ["incident", s.incidents.filter((i) => i.projectId === p.id && i.status !== "Closed").length],
    ["corrective action", s.actions.filter((a) => a.projectId === p.id && a.status === "Open").length],
    ["defect", s.defects.filter((d) => d.projectId === p.id && d.status !== "Closed").length],
    ["permit", s.permits.filter((x) => x.projectId === p.id && (x.status === "Requested" || x.status === "Approved")).length],
  ] as const;
  const outstanding = open.filter(([, n]) => n > 0);
  const subs = s.subs.filter((x) => x.projects.includes(p.id));
  const pending = s.invites.filter((i) => i.projectId === p.id && i.status === "Pending").length;

  return (
    <Modal title={`Close ${p.name}`} sub="Store it as finished. Nothing is deleted." onClose={onClose}>
      <div className="space-y-4 text-sm">
        {outstanding.length > 0 ? (
          <div className="rounded-xl border border-accent bg-accent/10 p-4">
            <p className="font-semibold">Still open on this project</p>
            <ul className="mt-1 list-disc pl-5 text-ink-soft">
              {outstanding.map(([k, n]) => (
                <li key={k}>
                  {n} {k}
                  {n === 1 ? "" : "s"}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-ink-soft">
              You can still close it. These stay on record as they are, and you can reopen the project later.
            </p>
          </div>
        ) : (
          <p className="flex items-center gap-2 rounded-xl bg-tint px-4 py-3">
            <Icon name="check" className="h-4 w-4" /> No open incidents, actions, defects or permits.
          </p>
        )}

        <div>
          <p className="font-semibold">Closing will</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-ink-soft">
            <li>Sign everyone off the site ({p.onSite.length} on site now).</li>
            <li>
              Mark {subs.length} subcontractor{subs.length === 1 ? "" : "s"} as finished on it. They see it under
              their completed jobs.
            </li>
            {pending > 0 && <li>Cancel {pending} invitation{pending === 1 ? "" : "s"} nobody has answered.</li>}
            <li>Move it to Archived, read-only, with every SWMS, inspection, incident, signature and the audit log kept.</li>
          </ul>
        </div>

        <Field label="Closing note" hint="optional">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Practical completion reached, handover pack sent"
            className={field}
          />
        </Field>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnLight}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              s.closeProject(p.id, note);
              onClose();
            }}
            className={btnDark}
          >
            Close and store project
          </button>
        </div>
      </div>
    </Modal>
  );
}
