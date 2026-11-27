"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { AttachField, AttachmentStrip } from "@/components/app/Attachments";
import { PlantSubmitForm } from "@/components/app/PlantSubmitForm";
import {
  btnLight,
  Card,
  CardHead,
  EmptyState,
  PageHeading,
  Pill,
} from "@/components/app/ui";
import { ExpiryPill } from "@/components/portal/ExpiryPill";
import { usePortal } from "@/components/portal/usePortal";
import { fmtDate } from "@/lib/format";

export default function PortalPlantDetail() {
  const { id } = useParams<{ id: string }>();
  const p = usePortal();
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  const x = p.plant.find((y) => y.id === id && y.ownerId === p.subId);
  const o = x?.onboarding;

  if (!p.ready)
    return (
      <p className="py-10 text-center text-sm text-ink-soft">Loading plant</p>
    );
  if (!x || !o)
    return (
      <Card>
        <EmptyState title="This plant was not found." />
        <p className="px-5 pb-5 text-center text-sm">
          <Link href="/portal/plant" className="font-semibold underline">
            Back to my plant
          </Link>
        </p>
      </Card>
    );

  const site = p.projects.find((pr) => pr.id === x.projectId);
  const canFix = o.status === "Declined" || o.status === "Withdrawn";

  if (editing && canFix)
    return (
      <>
        <PageHeading
          title={`Correct ${x.name}`}
          sub="Fix what the builder asked for, then send it again."
        />
        <PlantSubmitForm
          mode="portal"
          existing={x}
          cancelHref={`/portal/plant/${x.id}`}
          onDone={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      </>
    );

  return (
    <>
      <Link
        href="/portal/plant"
        className="mb-3 inline-block text-xs font-semibold underline"
      >
        Back to my plant
      </Link>
      <PageHeading
        title={x.name}
        sub={`${x.kind} · ${x.serial} · ${site?.name ?? "Site"}`}
        actions={
          <Pill
            tone={
              o.status === "Approved"
                ? "ok"
                : o.status === "Declined"
                  ? "owed"
                  : "neutral"
            }
          >
            {o.status === "Submitted" ? "Waiting for the builder" : o.status}
          </Pill>
        }
      />

      <div className="space-y-6">
        <Card>
          <CardHead title="Where it stands" />
          <div className="space-y-3 p-5 text-sm">
            {o.status === "Submitted" && (
              <>
                <p>
                  The builder is checking your documents and will inspect the
                  plant when it arrives on {fmtDate(o.onSiteFrom)}. It cannot be
                  used until it is approved.
                </p>
                <button
                  type="button"
                  onClick={() => p.withdrawPlant(x.id)}
                  className={btnLight}
                >
                  Withdraw this request
                </button>
              </>
            )}
            {o.status === "Approved" && (
              <>
                <p>
                  Approved by {o.decidedBy}
                  {o.decidedAt && `, ${fmtDate(o.decidedAt.slice(0, 10))}`}. It
                  is on the plant register for {site?.name}.
                </p>
                {o.conditions && (
                  <p className="rounded-xl bg-tint px-4 py-3">
                    <span className="font-semibold">Conditions: </span>
                    {o.conditions}
                  </p>
                )}
              </>
            )}
            {o.status === "Declined" && (
              <>
                <p>
                  <span className="font-semibold">Declined: </span>
                  {o.note || "No reason was recorded."}
                </p>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className={btnLight}
                >
                  Correct and send again
                </button>
              </>
            )}
            {o.status === "Withdrawn" && (
              <>
                <p className="text-ink-soft">You withdrew this request.</p>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className={btnLight}
                >
                  Edit and submit again
                </button>
              </>
            )}
          </div>
        </Card>

        {o.status === "Approved" && o.docs.some((d) => d.later) && (
          <Card>
            <CardHead
              title="Commissioning paperwork"
              sub="Upload this once the plant has been installed. The builder verifies it, and the plant cannot be used until then."
            />
            <ul className="divide-y divide-line">
              {o.docs
                .filter((d) => d.later)
                .map((d) => (
                  <li key={d.id} className="space-y-3 px-5 py-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="min-w-0 flex-1 text-sm font-semibold">
                        {d.kind}
                      </span>
                      <Pill tone={d.verified ? "ok" : d.files?.length ? "neutral" : "owed"}>
                        {d.verified
                          ? "Verified"
                          : d.files?.length
                            ? "Waiting for the builder"
                            : "To upload"}
                      </Pill>
                    </div>
                    <AttachField
                      files={d.files ?? []}
                      disabled={d.verified}
                      label="Attach commissioning paperwork"
                      onChange={(files) => p.setPlantDocFiles(x.id, d.id, files)}
                    />
                  </li>
                ))}
            </ul>
          </Card>
        )}

        <Card>
          <CardHead title="Documents" />
          <ul className="divide-y divide-line">
            {o.docs.map((d) => (
              <li key={d.id} className="space-y-2 px-5 py-3.5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="min-w-0 flex-1 text-sm font-semibold">
                    {d.kind}
                  </span>
                  {d.expires ? (
                    <ExpiryPill expires={d.expires} warn={p.warn} />
                  ) : (
                    <Pill tone="neutral">No expiry</Pill>
                  )}
                  <Pill tone={d.verified ? "ok" : "neutral"}>
                    {d.verified ? "Verified" : "Not checked yet"}
                  </Pill>
                </div>
                <AttachmentStrip files={d.files} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
