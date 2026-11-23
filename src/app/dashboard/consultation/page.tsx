"use client";

import { MeetingsView } from "@/components/app/MeetingsView";

export default function WhsMeetingsPage() {
  return (
    <MeetingsView
      kinds={["WHS committee","Coordination meeting"]}
      base="/dashboard/consultation"
      title="WHS Meetings"
      sub="WHS committee meetings and subcontractor coordination meetings. Record what was discussed and have each attendee sign, so consultation with workers is on the record."
      noun="meeting"
      emptyTitle="No meetings yet."
      emptyBody="Start or schedule a WHS committee or coordination meeting."
    />
  );
}
