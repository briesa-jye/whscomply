"use client";

import { useParams } from "next/navigation";
import { PlantReview } from "@/components/app/PlantReview";

export default function PlantReviewPage() {
  const { id } = useParams<{ id: string }>();
  return <PlantReview id={id} base="/dashboard/plant/onboarding" />;
}
