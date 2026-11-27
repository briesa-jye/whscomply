"use client";

import { useParams } from "next/navigation";
import { PlantPrestart } from "@/components/app/PlantPrestart";

export default function PlantPrestartPage() {
  const { id } = useParams<{ id: string }>();
  return <PlantPrestart id={id} />;
}
