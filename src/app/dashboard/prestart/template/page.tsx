"use client";

import { TemplateEditor } from "@/components/app/TemplateEditor";

export default function PrestartTemplatePage() {
  return (
    <TemplateEditor kinds={["Pre-start meeting"]} base="/dashboard/prestart" noun="pre-start" />
  );
}
