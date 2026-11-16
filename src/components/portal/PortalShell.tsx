"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Icon, type IconName } from "../Icons";
import { signInAs } from "../app/DemoStore";
import { Avatar } from "../app/ui";
import { usePortal } from "./usePortal";

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  badge?: number;
};

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "S"
  );
}

/** The subcontractor's own dashboard: only their projects, crew, documents and the safety records they sign. */
export function PortalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const p = usePortal();
  const [open, setOpen] = useState(false);

  // Builders have their own dashboard.
  useEffect(() => {
    if (p.ready && p.settings.account !== "subcontractor")
      router.replace("/dashboard");
  }, [p.ready, p.settings.account, router]);

  const items: NavItem[] = [
    { href: "/portal", label: "Overview", icon: "grid" },
    {
      href: "/portal/projects",
      label: "My projects",
      icon: "building",
      badge: p.pending.length,
    },
    {
      href: "/portal/swms",
      label: "SWMS to sign",
      icon: "file",
      badge: p.unsigned.length,
    },
    {
      href: "/portal/compliance",
      label: "My compliance",
      icon: "shield",
      badge: p.docsDue.length,
    },
    {
      href: "/portal/crew",
      label: "My crew",
      icon: "users",
      badge: p.ticketsDue.length + p.uninducted.length,
    },
    {
      href: "/portal/actions",
      label: "Actions",
      icon: "check",
      badge: p.openActions.length,
    },
    { href: "/portal/report", label: "Report an incident", icon: "alert" },
  ];
  const isActive = (href: string) =>
    href === "/portal" ? pathname === href : pathname.startsWith(href);
  const inSettings = pathname.startsWith("/portal/settings");
  const name = p.sub?.name ?? "Your business";

  const sidebar = (
    <div className="flex h-full min-h-0 flex-col">
      <Link
        href="/portal"
        className="flex h-16 shrink-0 items-center px-5"
        onClick={() => setOpen(false)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.svg"
          alt="WHSCOMPLY"
          width={427}
          height={63}
          className="h-6 w-auto"
        />
      </Link>

      <div className="mx-3 shrink-0 rounded-xl border border-line bg-surface px-3 py-2.5">
        <p className="truncate text-sm font-bold">{name}</p>
        <p className="text-xs text-ink-soft">Subcontractor · Free account</p>
      </div>

      <nav
        aria-label="Portal"
        data-lenis-prevent
        className="mt-4 min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-3 pb-3"
      >
        {items.map((n) => {
          const active = isActive(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                active
                  ? "bg-accent/20 text-ink"
                  : "text-ink-soft hover:bg-tint hover:text-ink"
              }`}
            >
              <Icon name={n.icon} className="h-[18px] w-[18px]" />
              {n.label}
              {!!n.badge && (
                <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-ink">
                  {n.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 shrink-0 rounded-xl border border-line bg-surface p-3">
        <div className="flex items-center gap-3">
          <Avatar initials={initials(p.sub?.contact ?? name)} tone={0} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">
              {p.sub?.contact || name}
            </p>
            <p className="truncate text-xs text-ink-soft">
              {p.sub?.trade || "Subcontractor"}
            </p>
          </div>
        </div>
        <Link
          href="/login"
          className="mt-3 flex items-center gap-2 text-xs font-semibold text-ink-soft hover:text-ink"
        >
          <Icon name="logout" className="h-3.5 w-3.5" /> Sign out
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg text-ink lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh border-r border-line bg-bg lg:block">
        {sidebar}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-ink/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-bg shadow-2xl">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur sm:px-8">
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg lg:hidden"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <Icon name="menu" className="h-6 w-6" />
          </button>
          <p className="hidden truncate text-sm text-ink-soft sm:block">
            Working on{" "}
            <span className="font-semibold text-ink">
              {p.myProjects.length} project{p.myProjects.length === 1 ? "" : "s"}
            </span>{" "}
            for{" "}
            {p.myProjects.length
              ? "your builders"
              : "no builder yet. Accept an invitation to start"}
          </p>
          <span className="ml-auto flex items-center gap-2 sm:gap-3">
            <span className="hidden rounded-full bg-tint px-3 py-1 text-[11px] font-semibold text-ink-soft xl:inline">
              Sample data
            </span>
            <Link
              href="/portal/settings"
              aria-label="Settings"
              aria-current={inSettings ? "page" : undefined}
              className={`flex h-10 w-10 items-center justify-center rounded-full hover:bg-tint ${
                inSettings ? "bg-accent/20" : ""
              }`}
            >
              <Icon name="settings" className="h-5 w-5" />
            </Link>
            <span className="hidden sm:block">
              <Avatar initials={initials(p.sub?.contact ?? name)} tone={0} />
            </span>
          </span>
        </header>

        <div className="border-b border-line bg-tint/60 px-4 py-2 text-center text-xs text-ink-soft sm:px-8">
          You are viewing the subcontractor portal with sample data. Changes are
          saved in this browser only.{" "}
          <button
            type="button"
            onClick={() => {
              signInAs("builder");
              router.push("/dashboard");
            }}
            className="font-semibold underline"
          >
            View the builder dashboard
          </button>
        </div>

        <div className="app-content mx-auto max-w-6xl p-4 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
