"use client";

import { useState } from "react";
import { Icon } from "@/components/Icons";
import { useScope } from "@/components/app/DemoStore";
import { Modal } from "@/components/app/Modal";
import { btnDark, btnLight, Field, field } from "@/components/app/ui";
import type { Project, Worker } from "@/lib/data";

/** The worker reads each induction topic, ticks it, and signs by typing their name. */
export function InductModal({
  project,
  worker,
  onClose,
}: {
  project: Project;
  worker: Worker;
  onClose: () => void;
}) {
  const s = useScope();
  const [ticked, setTicked] = useState<string[]>([]);
  const [sig, setSig] = useState("");
  const first = worker.name.toLowerCase().split(/\s+/)[0];
  const signed =
    sig.trim().toLowerCase().includes(first) && sig.trim().length >= 3;
  const all = ticked.length === project.inductionTopics.length;

  return (
    <Modal
      title={`Induct ${worker.name}`}
      sub={`${project.name}. The worker reads each topic and signs at the end.`}
      onClose={onClose}
      wide
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          s.recordInduction({
            projectId: project.id,
            workerId: worker.id,
            by: "Sam Kowalski",
            topics: ticked.length,
            signedAs: sig.trim(),
          });
          onClose();
        }}
        className="space-y-4"
      >
        <ul className="space-y-2">
          {project.inductionTopics.map((t) => {
            const on = ticked.includes(t);
            return (
              <li key={t}>
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm ${on ? "border-ink bg-tint/50" : "border-line"}`}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={(e) =>
                      setTicked(
                        e.target.checked
                          ? [...ticked, t]
                          : ticked.filter((x) => x !== t),
                      )
                    }
                    className="mt-0.5 accent-[var(--ink)]"
                  />
                  {t}
                </label>
              </li>
            );
          })}
        </ul>
        <Field
          label={`I have read and understood the above. Type your full name to sign: ${worker.name}`}
        >
          <input
            value={sig}
            onChange={(e) => setSig(e.target.value)}
            className={field}
            autoComplete="off"
          />
        </Field>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnLight}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={!all || !signed}
            className={`${btnDark} disabled:cursor-not-allowed disabled:opacity-40`}
          >
            <Icon name="check" className="h-4 w-4" /> Sign and complete
            induction
          </button>
        </div>
      </form>
    </Modal>
  );
}
