"use client";

import { MeetingsView } from "@/components/app/MeetingsView";

export default function PrestartPage() {
  return (
    <MeetingsView
      kinds={["Pre-start meeting"]}
      title="Pre-start meetings"
      sub="The daily briefing before work starts. Record what was covered and tick off who attended, so briefing and consultation with workers are on the record."
      addLabel="Schedule pre-start"
      emptyTitle="No pre-starts yet."
      emptyBody="Schedule one and the project's crew is added to the attendance list."
    />
  );
}
