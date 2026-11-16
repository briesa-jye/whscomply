"use client";

import { useState, type FormEvent } from "react";
import { usePortal } from "@/components/portal/usePortal";
import { btnDark, Card, CardHead, Field, field, PageHeading } from "@/components/app/ui";

export default function PortalSettings() {
  const p = usePortal();
  const [saved, setSaved] = useState(false);

  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const g = (k: string) => String(d.get(k) ?? "").trim();
    p.updateSub(p.subId, {
      name: g("name"),
      trade: g("trade"),
      contact: g("contact"),
      phone: g("phone"),
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  }

  return (
    <>
      <PageHeading
        title="Settings"
        sub="Your business details, shown to every builder you work for."
      />
      <Card className="max-w-2xl">
        <CardHead title="Business details" sub="Free subcontractor account" />
        <form
          key={p.subId}
          onSubmit={save}
          className="grid gap-4 p-5 sm:grid-cols-2"
        >
          <Field label="Business name" className="sm:col-span-2">
            <input name="name" required defaultValue={p.sub?.name} className={field} />
          </Field>
          <Field label="Trade">
            <input name="trade" defaultValue={p.sub?.trade} placeholder="Electrical" className={field} />
          </Field>
          <Field label="Main contact">
            <input name="contact" defaultValue={p.sub?.contact} className={field} />
          </Field>
          <Field label="Phone" className="sm:col-span-2">
            <input name="phone" defaultValue={p.sub?.phone} className={field} />
          </Field>
          <div className="flex items-center gap-3 sm:col-span-2">
            <button type="submit" className={btnDark}>
              Save changes
            </button>
            {saved && (
              <span role="status" className="text-sm text-ink-soft">
                Saved
              </span>
            )}
          </div>
        </form>
      </Card>
      <p className="mt-4 max-w-2xl text-sm text-ink-soft">
        Your account is always free. Builders pay for the projects they invite
        you to.
      </p>
    </>
  );
}
