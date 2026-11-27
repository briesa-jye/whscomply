"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeading } from "@/components/app/ui";
import { SiteOnboardingForm } from "@/components/portal/SiteOnboardingForm";
import { usePortal } from "@/components/portal/usePortal";

export default function PortalSiteOnboarding() {
  const { projectId } = useParams<{ projectId: string }>();
  const p = usePortal();
  const project = p.projects.find((x) => x.id === projectId);

  return (
    <>
      <Link
        href="/portal/projects"
        className="mb-3 inline-block text-xs font-semibold underline"
      >
        Back to my projects
      </Link>
      <PageHeading
        title={`Site onboarding${project ? `: ${project.name}` : ""}`}
        sub="Before your crew start on this site, supply your SWMS and a safety data sheet for each hazardous chemical you will bring."
      />
      <SiteOnboardingForm projectId={projectId} />
    </>
  );
}
