"use client";

import { TemplateEditor } from "@/components/app/TemplateEditor";

export default function ToolboxTemplatePage() {
  return (
    <TemplateEditor kinds={["Toolbox talk"]} base="/dashboard/toolbox" noun="toolbox talk" />
  );
}
