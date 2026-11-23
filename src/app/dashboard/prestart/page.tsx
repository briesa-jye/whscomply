"use client";

import { MeetingsView } from "@/components/app/MeetingsView";

export default function PrestartPage() {
  return (
    <MeetingsView
      kinds={["Pre-start meeting"]}
      base="/dashboard/prestart"
      title="Pre-start meetings"
      sub="The daily briefing before work starts. Start one on the spot or schedule it, then everyone signs with a drawn signature linked to their profile."
      noun="pre-start"
      emptyTitle="No pre-starts yet."
      emptyBody="Start one now, or schedule the next one. The crew signs on screen."
    />
  );
}
