"use client";

import { TemplateEditor } from "@/components/app/TemplateEditor";

export default function WhsMeetingsTemplatePage() {
  return (
    <TemplateEditor kinds={["WHS committee","Coordination meeting"]} base="/dashboard/consultation" noun="meeting" />
  );
}
