import type { Metadata } from "next";
import { Suspense } from "react";
import { DemoStoreProvider } from "@/components/app/DemoStore";
import { MeShell } from "@/components/me/MeShell";

export const metadata: Metadata = {
  title: { default: "My profile", template: "%s | WHSCOMPLY" },
  robots: { index: false, follow: false },
};

export default function MeLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <p className="p-10 text-center text-sm text-ink-soft">
          Loading your profile
        </p>
      }
    >
      <DemoStoreProvider>
        <MeShell>{children}</MeShell>
      </DemoStoreProvider>
    </Suspense>
  );
}
