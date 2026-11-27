"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlantSubmitForm } from "@/components/app/PlantSubmitForm";
import { PageHeading } from "@/components/app/ui";

export default function OnboardPlantPage() {
  const router = useRouter();
  return (
    <>
      <Link
        href="/dashboard/plant/onboarding"
        className="mb-3 inline-block text-xs font-semibold underline"
      >
        Back to plant onboarding
      </Link>
      <PageHeading
        title="Onboard plant"
        sub="Put plant forward for a site, for your own plant or for a subcontractor. You will then verify its documents, inspect it and approve it."
      />
      <PlantSubmitForm
        mode="builder"
        cancelHref="/dashboard/plant/onboarding"
        onDone={(id) => router.push(`/dashboard/plant/onboarding/${id}`)}
      />
    </>
  );
}
