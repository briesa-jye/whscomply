import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/AuthShell";
import { SignUpForm } from "./SignUpForm";

export const metadata: Metadata = {
  title: "Sign up",
  description:
    "Create your WHSCOMPLY workspace and start a free trial for your building business.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/signup" },
};

export default function SignUpPage() {
  return (
    <AuthShell fixed>
      <Suspense fallback={<SignUpForm />}>
        <SignUpForm withPlanFromUrl />
      </Suspense>
    </AuthShell>
  );
}
