"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AttachField } from "@/components/app/Attachments";
import { useStore } from "@/components/app/DemoStore";
import {
  btnDark,
  btnLight,
  Card,
  Field,
  field,
  PageHeading,
} from "@/components/app/ui";
import { HAZARD_CLASSES } from "@/lib/data";
import type { Attachment } from "@/lib/files";
import { todayISO } from "@/lib/format";

export default function AddChemicalPage() {
  const s = useStore();
  const router = useRouter();
  const projects = s.projects.filter((p) => !p.closedAt);
  const [projectId, setProjectId] = useState(
    s.projectId && s.projectId !== "all" ? s.projectId : "",
  );
  const [name, setName] = useState("");
  const [supplier, setSupplier] = useState("");
  const [hazard, setHazard] = useState<string>(HAZARD_CLASSES[0]);
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("");
  const [hasSds, setHasSds] = useState(true);
  const [sdsDate, setSdsDate] = useState("");
  const [controls, setControls] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);

  return (
    <>
      <Link
        href="/dashboard/chemicals"
        className="mb-3 inline-block text-xs font-semibold underline"
      >
        Back to hazardous chemicals
      </Link>
      <PageHeading
        title="Add a hazardous chemical"
        sub="For chemicals your own business brings to site. Subcontractors' chemicals come through their site onboarding."
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          s.addChemical({
            projectId,
            name: name.trim(),
            supplier: supplier.trim(),
            hazard,
            quantity: quantity.trim(),
            location: location.trim(),
            hasSds,
            sdsDate: hasSds ? sdsDate || todayISO() : null,
            controls: controls.trim(),
            files,
          });
          router.push("/dashboard/chemicals");
        }}
        className="space-y-6"
      >
        <Card>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Product name" className="sm:col-span-2">
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={field}
              />
            </Field>
            <Field label="Project">
              <select
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className={field}
              >
                <option value="" disabled>
                  Choose a project
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Supplier">
              <input
                required
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className={field}
              />
            </Field>
            <Field label="Hazard class">
              <select
                value={hazard}
                onChange={(e) => setHazard(e.target.value)}
                className={field}
              >
                {HAZARD_CLASSES.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </Field>
            <Field label="Quantity on site">
              <input
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="4 x 20 L"
                className={field}
              />
            </Field>
            <Field label="Stored at" className="sm:col-span-2">
              <input
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={field}
              />
            </Field>
            <Field label="Safety data sheet on file?">
              <select
                value={hasSds ? "yes" : "no"}
                onChange={(e) => setHasSds(e.target.value === "yes")}
                className={field}
              >
                <option value="yes">Yes</option>
                <option value="no">Not yet</option>
              </select>
            </Field>
            {hasSds && (
              <Field label="SDS issue date">
                <input
                  type="date"
                  value={sdsDate}
                  onChange={(e) => setSdsDate(e.target.value)}
                  className={field}
                />
              </Field>
            )}
            {hasSds && (
              <div className="sm:col-span-2">
                <p className="mb-1 text-sm font-medium">The SDS itself</p>
                <AttachField
                  files={files}
                  onChange={setFiles}
                  label="Attach the SDS"
                  accept="image/*,.pdf"
                />
              </div>
            )}
            <Field label="Controls" className="sm:col-span-2">
              <textarea
                required
                rows={3}
                value={controls}
                onChange={(e) => setControls(e.target.value)}
                className={field}
              />
            </Field>
          </div>
        </Card>
        <div className="flex flex-wrap justify-end gap-2">
          <Link href="/dashboard/chemicals" className={btnLight}>
            Cancel
          </Link>
          <button type="submit" className={btnDark}>
            Add chemical
          </button>
        </div>
      </form>
    </>
  );
}
