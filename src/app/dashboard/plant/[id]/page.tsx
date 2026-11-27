"use client";

import { useParams } from "next/navigation";
import { PlantDetail } from "@/components/app/PlantDetail";

export default function PlantDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <PlantDetail id={id} />;
}
