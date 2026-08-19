import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Not found" };

/**
 * Reached both by a bad URL and by `notFound()` on a scan id.
 *
 * The wording covers both without guessing, because the backend answers 404
 * for someone else's scan too — never 403 — precisely so ids cannot be probed.
 * Saying "you do not have access to this scan" here would give away exactly
 * what that design is protecting.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <p className="font-mono text-sm text-muted">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">Not found</h1>
      <p className="text-sm text-muted">
        This page does not exist, or the scan it refers to is not one of yours.
      </p>
      <div className="mt-2 flex gap-2">
        <ButtonLink href="/scans">Your scans</ButtonLink>
        <ButtonLink href="/" variant="secondary">
          Home
        </ButtonLink>
      </div>
    </main>
  );
}
