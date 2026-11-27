"use client";

import { useParams } from "next/navigation";
import { PlantCare } from "@/components/app/PlantCare";

export default function PlantCarePage() {
  const { id } = useParams<{ id: string }>();
  return <PlantCare id={id} />;
}
