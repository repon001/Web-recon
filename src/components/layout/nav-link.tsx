"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

import { cn } from "@/lib/ui/cn";

/**
 * A nav link that knows whether it is the current page.
 *
 * Client-side because `usePathname` is, but it is the only part of the header
 * that has to be — the rest of the shell stays a Server Component and never
 * ships.
 */
export function NavLink({
  href,
  exact = false,
  className,
  ...props
}: ComponentProps<typeof Link> & { exact?: boolean }) {
  const pathname = usePathname();
  const target = typeof href === "string" ? href : href.pathname ?? "";
  // `/scans` should light up while reading `/scans/abc123`, but `/scans/new`
  // must not also match it — hence the exact flag on the more specific entry.
  const active = exact ? pathname === target : pathname === target || pathname.startsWith(`${target}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-surface-muted text-foreground" : "text-muted hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}
