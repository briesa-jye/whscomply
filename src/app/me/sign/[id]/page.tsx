"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore } from "@/components/app/DemoStore";
import { SignaturePad, SignatureView } from "@/components/app/SignaturePad";
import {
  Card,
  CardHead,
  EmptyState,
  PageHeading,
  Pill,
} from "@/components/app/ui";
import { meetingStatus } from "@/lib/data";
import { fmtDate } from "@/lib/format";

export default function SignMeeting() {
  const { id } = useParams<{ id: string }>();
  const s = useStore();
  const me = s.workers.find((w) => w.id === s.settings.workerId);
  const t = s.talks.find((x) => x.id === id);

  if (!me || !t)
    return (
      <Card>
        <EmptyState
          title="This meeting was not found."
          body="It may have been deleted."
        />
        <p className="px-5 pb-5 text-center text-sm">
          <Link href="/me" className="font-semibold underline">
            Back to my profile
          </Link>
        </p>
      </Card>
    );

  const sig = (t.signatures ?? []).find((g) => g.workerId === me.id);
  const status = meetingStatus(t);
  const invited =
    (t.sentTo ?? []).includes(me.id) || t.expected.includes(me.id);
  const project = s.projects.find((p) => p.id === t.projectId);

  return (
    <div className="space-y-6">
      <Link href="/me" className="inline-block text-xs font-semibold underline">
        Back to my profile
      </Link>
      <PageHeading
        title={t.topic}
        sub={`${t.kind ?? "Toolbox talk"} · ${project?.name ?? "Project"} · ${fmtDate(t.date)}${t.time ? ` ${t.time}` : ""} · ${t.presenter}`}
      />

      {t.notes && (
        <Card>
          <CardHead title="Key points" />
          <p className="whitespace-pre-wrap p-5 text-sm">{t.notes}</p>
        </Card>
      )}

      <Card>
        <CardHead
          title="Your signature"
          sub="Signing confirms you were there and understood what was covered."
          right={
            sig ? <Pill tone="ok">Signed</Pill> : <Pill tone="owed">To sign</Pill>
          }
        />
        <div className="p-5">
          {sig ? (
            <div className="space-y-3">
              <SignatureView path={sig.path} className="h-20 w-auto text-ink" />
              <p className="text-sm text-ink-soft">
                Signed {fmtDate(sig.at.slice(0, 10))} {sig.at.slice(11)}. The
                presenter can see this on the record.
              </p>
              <Link href="/me" className="text-sm font-semibold underline">
                Back to my profile
              </Link>
            </div>
          ) : status === "Completed" ? (
            <p className="text-sm text-ink-soft">
              This one has finished, so it can no longer be signed here. Ask the
              presenter if you were there.
            </p>
          ) : !invited ? (
            <p className="text-sm text-ink-soft">
              You have not been added to this one. Ask the presenter to add you.
            </p>
          ) : (
            <SignaturePad
              name={me.name}
              saveLabel="Sign and confirm attendance"
              onSave={(path) => s.signMeeting(t.id, me.id, path, "profile")}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
