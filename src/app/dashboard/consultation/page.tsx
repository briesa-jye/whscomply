"use client";

import { MeetingsView } from "@/components/app/MeetingsView";

export default function WhsMeetingsPage() {
  return (
    <MeetingsView
      kinds={["WHS committee", "Coordination meeting"]}
      title="WHS Meetings"
      sub="WHS committee meetings and subcontractor coordination meetings. Record who attended and what was discussed, so consultation with workers is on the record."
      addLabel="Schedule meeting"
      emptyTitle="No meetings yet."
      emptyBody="Schedule a WHS committee or coordination meeting and tick off who attends."
    />
  );
}
