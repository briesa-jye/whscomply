"use client";

import { useParams } from "next/navigation";
import { SiteOnboardingReview } from "@/components/app/SiteOnboardingReview";

export default function SiteOnboardingReviewPage() {
  const { id } = useParams<{ id: string }>();
  return <SiteOnboardingReview id={id} base="/dashboard/chemicals/onboarding" />;
}
