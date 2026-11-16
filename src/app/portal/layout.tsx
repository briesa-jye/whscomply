import type { Metadata } from "next";
import { Suspense } from "react";
import { DemoStoreProvider } from "@/components/app/DemoStore";
import { PortalShell } from "@/components/portal/PortalShell";

export const metadata: Metadata = {
  title: { default: "Subcontractor portal", template: "%s | WHSCOMPLY" },
  robots: { index: false, follow: false },
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <p className="p-10 text-center text-sm text-ink-soft">
          Loading your portal
        </p>
      }
    >
      <DemoStoreProvider>
        <PortalShell>{children}</PortalShell>
      </DemoStoreProvider>
    </Suspense>
  );
}
