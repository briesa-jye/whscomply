"use client";

import { MeetingNew } from "@/components/app/MeetingNew";

export default function PrestartNewPage() {
  return (
    <MeetingNew kinds={["Pre-start meeting"]} base="/dashboard/prestart" noun="pre-start" />
  );
}
