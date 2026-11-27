"use client";

import Link from "next/link";
import { useState } from "react";
import { AttachField } from "@/components/app/Attachments";
import { useStore } from "@/components/app/DemoStore";
import {
  btnDark,
  btnLight,
  Card,
  CardHead,
  Field,
  field,
} from "@/components/app/ui";
import {
  addDays,
  PLANT_KINDS,
  plantDocKinds,
  type Plant,
} from "@/lib/data";
import type { Attachment } from "@/lib/files";

type DocState = Record<string, { expires: string; files: Attachment[] }>;

/**
 * Put plant forward for a site. A subcontractor does this from its portal, for a site it has been
 * allocated to. The builder can also start it, for its own plant or for a subcontractor.
 * The builder then checks the documents, inspects the plant on arrival and approves it.
 */
export function PlantSubmitForm({
  mode,
  existing,
  onDone,
  cancelHref,
}: {
  mode: "builder" | "portal";
  /** declined or withdrawn plant being corrected and sent again */
  existing?: Plant;
  onDone: (id: string) => void;
  cancelHref: string;
}) {
  const s = useStore();
  const prev = existing?.onboarding;
  const subId = s.settings.subId ?? "s-apex";
  const mySub = s.subs.find((x) => x.id === subId);

  const [name, setName] = useState(existing?.name ?? "");
  const [kind, setKind] = useState(existing?.kind ?? PLANT_KINDS[0]);
  const [serial, setSerial] = useState(existing?.serial ?? "");
  const [ownerId, setOwnerId] = useState(
    existing?.ownerId ?? (mode === "portal" ? subId : "own"),
  );
  const [projectId, setProjectId] = useState(existing?.projectId ?? "");
  const [operator, setOperator] = useState(prev?.operator ?? "");
  const [onSiteFrom, setOnSiteFrom] = useState(
    prev?.onSiteFrom ?? addDays(1),
  );
  const [lastService, setLastService] = useState(
    existing?.lastService ?? addDays(-30),
  );
  const [nextService, setNextService] = useState(
    existing?.nextService ?? addDays(90),
  );
  const [electrical, setElectrical] = useState(
    existing ? existing.tagDue !== null : false,
  );
  const [tagDue, setTagDue] = useState(existing?.tagDue ?? addDays(90));
  const [docs, setDocs] = useState<DocState>(() =>
    Object.fromEntries(
      (prev?.docs ?? []).map((d) => [
        d.kind,
        { expires: d.expires ?? "", files: d.files ?? [] },
      ]),
    ),
  );

  const projects =
    mode === "portal"
      ? s.projects.filter(
          (p) => !p.closedAt && (mySub?.projects ?? []).includes(p.id),
        )
      : s.projects.filter((p) => !p.closedAt);
  const kinds = plantDocKinds(kind, electrical);
  const docOf = (k: string) => docs[k] ?? { expires: "", files: [] };
  const missing = kinds.some((d) => d.expires && !docOf(d.kind).expires);
  const ready = !!(name.trim() && serial.trim() && projectId && operator.trim());

  const submit = () => {
    const payload = {
      projectId,
      name: name.trim(),
      kind,
      serial: serial.trim(),
      ownerId,
      operator: operator.trim(),
      onSiteFrom,
      lastService,
      nextService,
      tagDue: electrical ? tagDue : null,
      docs: kinds.map((d) => ({
        kind: d.kind,
        expires: d.expires ? docOf(d.kind).expires || null : null,
        files: docOf(d.kind).files,
      })),
    };
    if (existing) {
      s.resubmitPlant(existing.id, payload);
      onDone(existing.id);
    } else onDone(s.submitPlant(payload));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-6"
    >
      <Card>
        <CardHead title="About the plant" />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Name or plant number" className="sm:col-span-2">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Boom lift BL-9"
              className={field}
            />
          </Field>
          <Field label="Type">
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className={field}
            >
              {PLANT_KINDS.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </Field>
          <Field label="Serial or ID">
            <input
              required
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              className={field}
            />
          </Field>
          <Field label="Last service">
            <input
              type="date"
              required
              value={lastService}
              onChange={(e) => setLastService(e.target.value)}
              className={field}
            />
          </Field>
          <Field label="Next service due">
            <input
              type="date"
              required
              value={nextService}
              onChange={(e) => setNextService(e.target.value)}
              className={field}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
            <input
              type="checkbox"
              checked={electrical}
              onChange={(e) => setElectrical(e.target.checked)}
              className="accent-[var(--ink)]"
            />
            Electrical equipment that needs test and tag
          </label>
          {electrical && (
            <Field label="Test and tag due">
              <input
                type="date"
                required
                value={tagDue}
                onChange={(e) => setTagDue(e.target.value)}
                className={field}
              />
            </Field>
          )}
        </div>
      </Card>

      <Card>
        <CardHead
          title="Where it is going and who runs it"
          sub={
            mode === "portal"
              ? "You can choose any site you have been allocated to."
              : undefined
          }
        />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {mode === "builder" && (
            <Field label="Owner">
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className={field}
              >
                <option value="own">Our own plant</option>
                {s.subs.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Site">
            <select
              required
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className={field}
            >
              <option value="" disabled>
                {projects.length ? "Choose a site" : "No sites available"}
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Operator" hint="name and licence number">
            <input
              required
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              placeholder="Dan Lopez, HRW licence WP-44218"
              className={field}
            />
          </Field>
          <Field label="Arrives on site">
            <input
              type="date"
              required
              value={onSiteFrom}
              onChange={(e) => setOnSiteFrom(e.target.value)}
              className={field}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHead
          title="Documents"
          sub="Attach each document and enter any expiry date. The builder checks every one before the plant is approved."
        />
        <ul className="divide-y divide-line">
          {kinds.map((d) => (
            <li key={d.kind} className="space-y-3 px-5 py-4">
              <p className="text-sm font-semibold">{d.kind}</p>
              <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
                {d.expires ? (
                  <Field label="Expires">
                    <input
                      type="date"
                      required
                      value={docOf(d.kind).expires}
                      onChange={(e) =>
                        setDocs((x) => ({
                          ...x,
                          [d.kind]: { ...docOf(d.kind), expires: e.target.value },
                        }))
                      }
                      className={field}
                    />
                  </Field>
                ) : (
                  <p className="self-end text-xs text-ink-soft">
                    No expiry date
                  </p>
                )}
                <AttachField
                  files={docOf(d.kind).files}
                  label="Attach file or photo"
                  onChange={(files) =>
                    setDocs((x) => ({
                      ...x,
                      [d.kind]: { ...docOf(d.kind), files },
                    }))
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {!ready && (
          <p className="mr-auto text-xs text-ink-soft">
            Name, serial, site and operator are needed.
          </p>
        )}
        <Link href={cancelHref} className={btnLight}>
          Cancel
        </Link>
        <button
          type="submit"
          disabled={!ready || missing}
          className={`${btnDark} disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {existing
            ? "Send again for approval"
            : mode === "portal"
              ? "Submit to the builder"
              : "Start onboarding"}
        </button>
      </div>
    </form>
  );
}
