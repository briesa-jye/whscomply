"use client";

import { MeetingNew } from "@/components/app/MeetingNew";

export default function ToolboxNewPage() {
  return (
    <MeetingNew kinds={["Toolbox talk"]} base="/dashboard/toolbox" noun="toolbox talk" />
  );
}
