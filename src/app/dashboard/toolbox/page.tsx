"use client";

import { MeetingsView } from "@/components/app/MeetingsView";

export default function ToolboxPage() {
  return (
    <MeetingsView
      kinds={["Toolbox talk"]}
      base="/dashboard/toolbox"
      title="Toolbox talks"
      sub="Short briefings on site. Record what was covered and have each person sign, so consultation is on the record."
      noun="toolbox talk"
      emptyTitle="No toolbox talks yet."
      emptyBody="Start one now or schedule one for later. The project's crew is added to the attendance list."
    />
  );
}
