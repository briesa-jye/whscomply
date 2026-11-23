"use client";

import { useParams } from "next/navigation";
import { MeetingRecord } from "@/components/app/MeetingRecord";

export default function WhsMeetingsRecordPage() {
  const { id } = useParams<{ id: string }>();
  return <MeetingRecord id={id} base="/dashboard/consultation" />;
}
