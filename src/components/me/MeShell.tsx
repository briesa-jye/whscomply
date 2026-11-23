"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { signInAs, useStore } from "@/components/app/DemoStore";
import { Avatar } from "@/components/app/ui";

/**
 * A worker's own profile. In the demo there are no real logins, so the builder's
 * "Open as" link switches to this view. Real accounts will replace that switch.
 */
export function MeShell({ children }: { children: ReactNode }) {
  const s = useStore();
  const router = useRouter();
  const me = s.workers.find((w) => w.id === s.settings.workerId);

  useEffect(() => {
    if (s.ready && s.settings.account !== "worker") router.replace("/dashboard");
  }, [s.ready, s.settings.account, router]);

  const name = me?.name ?? "Your profile";

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="flex h-16 items-center justify-between gap-3 border-b border-line bg-surface px-4 sm:px-8">
        <Link href="/me" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="WHSCOMPLY"
            width={427}
            height={63}
            className="h-6 w-auto"
          />
        </Link>
        <span className="flex items-center gap-3">
          <span className="hidden text-sm font-semibold sm:block">{name}</span>
          <Avatar
            initials={name
              .split(" ")
              .map((n) => n[0])
              .join("")}
            tone={1}
          />
        </span>
      </header>
      <div className="border-b border-line bg-tint/60 px-4 py-2 text-center text-xs text-ink-soft sm:px-8">
        You are viewing a worker profile with sample data. Changes are saved in
        this browser only.{" "}
        <button
          type="button"
          onClick={() => {
            signInAs("builder");
            router.push("/dashboard");
          }}
          className="font-semibold underline"
        >
          Back to the builder dashboard
        </button>
      </div>
      <main className="mx-auto max-w-3xl p-4 sm:p-8">
        {s.ready ? (
          children
        ) : (
          <p className="py-10 text-center text-sm text-ink-soft">
            Loading your profile
          </p>
        )}
      </main>
    </div>
  );
}
