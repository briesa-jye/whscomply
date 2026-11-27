"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlantSubmitForm } from "@/components/app/PlantSubmitForm";
import { PageHeading } from "@/components/app/ui";

export default function PortalSubmitPlant() {
  const router = useRouter();
  return (
    <>
      <Link
        href="/portal/plant"
        className="mb-3 inline-block text-xs font-semibold underline"
      >
        Back to my plant
      </Link>
      <PageHeading
        title="Submit plant"
        sub="Choose the site it is going to, then supply the documents. The builder approves it before it comes onto site."
      />
      <PlantSubmitForm
        mode="portal"
        cancelHref="/portal/plant"
        onDone={(id) => router.push(`/portal/plant/${id}`)}
      />
    </>
  );
}
