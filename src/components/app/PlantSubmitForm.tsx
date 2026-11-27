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
  Pill,
} from "@/components/app/ui";
import { addDays, type Plant } from "@/lib/data";
import {
  contractorPl,
  OPERATOR_LABEL,
  PLANT_TYPES,
  plantDocSpecs,
  plantTypeByKey,
  plantTypeOf,
} from "@/lib/plant-types";
import type { Attachment } from "@/lib/files";

type DocState = Record<string, { expires: string; files: Attachment[] }>;
type OperatorMode = keyof typeof OPERATOR_LABEL;

const num = (v: string) => (v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : null);

/**
 * Put plant forward for a site. What it asks for depends on the type of plant, and every field,
 * document and photo is mandatory. A subcontractor does this from its portal, for a site it has
 * been allocated to. The builder can also start it, for its own plant or for a subcontractor.
 * Public liability insurance is not asked for here: it is held with the contractor's own documents.
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
  const [typeKey, setTypeKey] = useState(
    existing ? plantTypeOf(existing).key : PLANT_TYPES[0].key,
  );
  const [serial, setSerial] = useState(existing?.serial ?? "");
  const [ownerId, setOwnerId] = useState(
    existing?.ownerId ?? (mode === "portal" ? subId : "own"),
  );
  const [projectId, setProjectId] = useState(existing?.projectId ?? "");
  const [capacity, setCapacity] = useState(
    existing?.capacityT != null ? String(existing.capacityT) : "",
  );
  const [flags, setFlags] = useState(
    existing?.flags ?? {
      roadRegistered: false,
      electrical: false,
      peopleLifting: false,
    },
  );
  const [operatorMode, setOperatorMode] = useState<OperatorMode | "">(
    existing?.operatorMode ?? "",
  );
  const [onSiteFrom, setOnSiteFrom] = useState(prev?.onSiteFrom ?? addDays(1));
  const [photo, setPhoto] = useState<Attachment[]>(existing?.photo ?? []);
  const [meter, setMeter] = useState(
    existing?.meter ? String(existing.meter.reading) : "",
  );
  const [svcLast, setSvcLast] = useState(existing?.lastService ?? "");
  const [svcNext, setSvcNext] = useState(existing?.nextService ?? "");
  const [svcLastR, setSvcLastR] = useState(
    existing?.serviceReading ? String(existing.serviceReading.last) : "",
  );
  const [svcNextR, setSvcNextR] = useState(
    existing?.serviceReading ? String(existing.serviceReading.next) : "",
  );
  const [mntLast, setMntLast] = useState(existing?.maintenance?.last ?? "");
  const [mntNext, setMntNext] = useState(existing?.maintenance?.next ?? "");
  const [mntLastR, setMntLastR] = useState(
    existing?.maintenance?.lastReading != null
      ? String(existing.maintenance.lastReading)
      : "",
  );
  const [mntNextR, setMntNextR] = useState(
    existing?.maintenance?.nextReading != null
      ? String(existing.maintenance.nextReading)
      : "",
  );
  const [docs, setDocs] = useState<DocState>(() =>
    Object.fromEntries(
      (prev?.docs ?? []).map((d) => [
        d.key ?? d.kind,
        { expires: d.expires ?? "", files: d.files ?? [] },
      ]),
    ),
  );

  const t = plantTypeByKey(typeKey) ?? PLANT_TYPES[0];
  const capacityT = t.capacity ? num(capacity) : null;
  const specs = plantDocSpecs(
    typeKey,
    {
      roadRegistered: t.road === "ask" && flags.roadRegistered,
      electrical: t.key === "electrical" || (!!t.asks?.includes("electrical") && flags.electrical),
      peopleLifting: !!t.asks?.includes("peopleLifting") && flags.peopleLifting,
    },
    capacityT,
  );
  const hasMeter = t.meter !== "none";
  const unit = t.meter === "km" ? "km" : "hours";
  const docOf = (k: string) => docs[k] ?? { expires: "", files: [] };

  const projects =
    mode === "portal"
      ? s.projects.filter(
          (p) => !p.closedAt && (mySub?.projects ?? []).includes(p.id),
        )
      : s.projects.filter((p) => !p.closedAt);
  const owner = s.subs.find((x) => x.id === ownerId);
  const pl = contractorPl(ownerId === "own" ? undefined : owner);

  // everything is mandatory, including every file
  const problems: string[] = [];
  const need = (ok: boolean, text: string) => {
    if (!ok) problems.push(text);
  };
  need(!!name.trim(), "Name or plant number");
  need(!!serial.trim(), "Serial or ID");
  need(!!projectId, "Site");
  need(!!operatorMode, "Operator arrangement");
  need(!!onSiteFrom, "Arrival date");
  need(photo.length > 0, "Photo of the whole machine");
  if (t.capacity) need(capacityT !== null && capacityT > 0, "Rated capacity");
  if (hasMeter) {
    need(num(meter) !== null, `Current ${unit} reading`);
    need(num(svcLastR) !== null && num(svcNextR) !== null, `Service readings in ${unit}`);
    need(num(mntLastR) !== null && num(mntNextR) !== null, `Maintenance readings in ${unit}`);
  }
  need(!!svcLast && !!svcNext, "Service dates");
  need(!!mntLast && !!mntNext, "Maintenance dates");
  for (const d of specs) {
    const v = docOf(d.key);
    need(v.files.length > 0, `${d.label}: attach the file`);
    if (d.expiry) need(!!v.expires, `${d.label}: date`);
  }

  const submit = () => {
    const tagDoc = specs.find((d) => d.key === "tag");
    const payload = {
      projectId,
      name: name.trim(),
      typeKey,
      serial: serial.trim(),
      ownerId,
      capacityT,
      flags: {
        roadRegistered: t.road === "ask" && flags.roadRegistered,
        electrical: !!tagDoc,
        peopleLifting: !!t.asks?.includes("peopleLifting") && flags.peopleLifting,
      },
      operatorMode: operatorMode as OperatorMode,
      onSiteFrom,
      meter: hasMeter
        ? { kind: t.meter as "hours" | "km", reading: num(meter) ?? 0 }
        : null,
      lastService: svcLast,
      nextService: svcNext,
      serviceReading: hasMeter
        ? { last: num(svcLastR) ?? 0, next: num(svcNextR) ?? 0 }
        : null,
      maintenance: {
        last: mntLast,
        next: mntNext,
        lastReading: hasMeter ? (num(mntLastR) ?? 0) : undefined,
        nextReading: hasMeter ? (num(mntNextR) ?? 0) : undefined,
      },
      tagDue: tagDoc ? docOf("tag").expires || null : null,
      photo,
      docs: specs.map((d) => ({
        key: d.key,
        kind: d.label,
        expires: d.expiry ? docOf(d.key).expires || null : null,
        files: docOf(d.key).files,
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
        if (problems.length === 0) submit();
      }}
      className="space-y-6"
    >
      <Card>
        <CardHead
          title="About the plant"
          sub="What you are asked for next depends on the type. Everything on this form is required."
        />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Name or plant number" className="sm:col-span-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Boom lift BL-9"
              className={field}
            />
          </Field>
          <Field label="Type of plant">
            <select
              value={typeKey}
              onChange={(e) => setTypeKey(e.target.value)}
              className={field}
            >
              {(["Standard", "Specialised"] as const).map((c) => (
                <optgroup
                  key={c}
                  label={c === "Standard" ? "Standard plant" : "Specialised plant"}
                >
                  {PLANT_TYPES.filter((x) => x.cls === c).map((x) => (
                    <option key={x.key} value={x.key}>
                      {x.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>
          <Field label="Serial or ID">
            <input
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              className={field}
            />
          </Field>
          {t.capacity && (
            <Field
              label="Rated capacity (tonnes)"
              hint="registration applies over 10 t"
            >
              <input
                type="number"
                min="0"
                step="0.1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className={field}
              />
            </Field>
          )}
          <div className="flex flex-col justify-end gap-2 text-sm font-medium sm:col-span-2">
            {t.road === "ask" && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={flags.roadRegistered}
                  onChange={(e) =>
                    setFlags({ ...flags, roadRegistered: e.target.checked })
                  }
                  className="accent-[var(--ink)]"
                />
                This plant is road registered
              </label>
            )}
            {t.asks?.includes("electrical") && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={flags.electrical}
                  onChange={(e) =>
                    setFlags({ ...flags, electrical: e.target.checked })
                  }
                  className="accent-[var(--ink)]"
                />
                Electrical equipment that needs test and tag
              </label>
            )}
            {t.asks?.includes("peopleLifting") && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={flags.peopleLifting}
                  onChange={(e) =>
                    setFlags({ ...flags, peopleLifting: e.target.checked })
                  }
                  className="accent-[var(--ink)]"
                />
                Designed to lift people (platform movement over 2.4 m)
              </label>
            )}
          </div>
          <div className="sm:col-span-2">
            <p className="mb-1 text-sm font-medium">
              Photo of the whole machine
            </p>
            <AttachField
              files={photo}
              onChange={(f) => setPhoto(f.slice(-1))}
              label="Add the photo"
              accept="image/*"
            />
          </div>
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
          <Field
            label="Who will operate it"
            hint={t.licence.toLowerCase()}
          >
            <select
              value={operatorMode}
              onChange={(e) => setOperatorMode(e.target.value as OperatorMode)}
              className={field}
            >
              <option value="" disabled>
                Choose
              </option>
              {(Object.keys(OPERATOR_LABEL) as OperatorMode[]).map((k) => (
                <option key={k} value={k}>
                  {OPERATOR_LABEL[k]}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs font-normal text-ink-soft">
              Operators are linked to the plant after their site induction.
            </span>
          </Field>
          <Field label="Arrives on site">
            <input
              type="date"
              value={onSiteFrom}
              onChange={(e) => setOnSiteFrom(e.target.value)}
              className={field}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHead
          title="Service and maintenance"
          sub="Service is the scheduled check-up, fluid and part changes, or a call-out to fix a fault. Maintenance is routine care to keep it working. Both have their own due dates, and a meter reading when the plant has a meter."
        />
        <div className="space-y-5 p-5">
          {hasMeter && (
            <Field
              label={`Current ${unit} reading`}
              className="max-w-xs"
            >
              <input
                type="number"
                min="0"
                value={meter}
                onChange={(e) => setMeter(e.target.value)}
                className={field}
              />
            </Field>
          )}
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-ink-soft">
              Service
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Last done">
                <input type="date" value={svcLast} onChange={(e) => setSvcLast(e.target.value)} className={field} />
              </Field>
              <Field label="Next due">
                <input type="date" value={svcNext} onChange={(e) => setSvcNext(e.target.value)} className={field} />
              </Field>
              {hasMeter && (
                <>
                  <Field label={`Last done at (${unit})`}>
                    <input type="number" min="0" value={svcLastR} onChange={(e) => setSvcLastR(e.target.value)} className={field} />
                  </Field>
                  <Field label={`Next due at (${unit})`}>
                    <input type="number" min="0" value={svcNextR} onChange={(e) => setSvcNextR(e.target.value)} className={field} />
                  </Field>
                </>
              )}
            </div>
          </div>
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-ink-soft">
              Maintenance
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Last done">
                <input type="date" value={mntLast} onChange={(e) => setMntLast(e.target.value)} className={field} />
              </Field>
              <Field label="Next due">
                <input type="date" value={mntNext} onChange={(e) => setMntNext(e.target.value)} className={field} />
              </Field>
              {hasMeter && (
                <>
                  <Field label={`Last done at (${unit})`}>
                    <input type="number" min="0" value={mntLastR} onChange={(e) => setMntLastR(e.target.value)} className={field} />
                  </Field>
                  <Field label={`Next due at (${unit})`}>
                    <input type="number" min="0" value={mntNextR} onChange={(e) => setMntNextR(e.target.value)} className={field} />
                  </Field>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHead
          title={`Documents for a ${t.label.toLowerCase()}`}
          sub="Attach a file for every document and enter any date it asks for. The builder checks each one before the plant is approved."
          right={
            mode === "portal" || ownerId !== "own" ? (
              <Pill tone={pl === "ok" ? "ok" : pl === "n/a" ? "neutral" : "owed"}>
                {pl === "ok"
                  ? "Your public liability is on file"
                  : pl === "n/a"
                    ? "Insurance held at business level"
                    : pl === "expired"
                      ? "Public liability expired"
                      : "No public liability on file"}
              </Pill>
            ) : undefined
          }
        />
        <p className="border-b border-line px-5 py-3 text-xs text-ink-soft">
          Public liability insurance is not uploaded with plant. The builder
          checks the contractor&apos;s own compliance documents.
        </p>
        <ul className="divide-y divide-line">
          {specs.map((d) => (
            <li key={d.key} className="space-y-3 px-5 py-4">
              <div>
                <p className="text-sm font-semibold">{d.label}</p>
                {d.help && (
                  <p className="text-xs text-ink-soft">{d.help}</p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
                {d.expiry ? (
                  <Field label="Date">
                    <input
                      type="date"
                      value={docOf(d.key).expires}
                      onChange={(e) =>
                        setDocs((x) => ({
                          ...x,
                          [d.key]: { ...docOf(d.key), expires: e.target.value },
                        }))
                      }
                      className={field}
                    />
                  </Field>
                ) : (
                  <p className="self-end text-xs text-ink-soft">No date needed</p>
                )}
                <AttachField
                  files={docOf(d.key).files}
                  label="Attach file or photo"
                  onChange={(files) =>
                    setDocs((x) => ({
                      ...x,
                      [d.key]: { ...docOf(d.key), files },
                    }))
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <div className="space-y-3">
        {problems.length > 0 && (
          <div className="rounded-xl bg-accent/15 px-4 py-3 text-sm">
            <p className="font-semibold">
              {problems.length} thing{problems.length === 1 ? "" : "s"} still
              to complete before you can submit:
            </p>
            <ul className="mt-1 list-inside list-disc text-xs">
              {problems.slice(0, 8).map((x) => (
                <li key={x}>{x}</li>
              ))}
              {problems.length > 8 && <li>and {problems.length - 8} more</li>}
            </ul>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link href={cancelHref} className={btnLight}>
            Cancel
          </Link>
          <button
            type="submit"
            disabled={problems.length > 0}
            className={`${btnDark} disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {existing
              ? "Send again for approval"
              : mode === "portal"
                ? "Submit to the builder"
                : "Start onboarding"}
          </button>
        </div>
      </div>
    </form>
  );
}
