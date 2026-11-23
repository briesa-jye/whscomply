"use client";

import { MeetingNew } from "@/components/app/MeetingNew";

export default function WhsMeetingsNewPage() {
  return (
    <MeetingNew kinds={["WHS committee","Coordination meeting"]} base="/dashboard/consultation" noun="meeting" />
  );
}
