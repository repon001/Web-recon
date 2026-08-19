"use client";

import { useFormStatus } from "react-dom";

import { logoutAction } from "@/lib/auth/actions";

/**
 * Sign out as a form POST, not a link.
 *
 * A GET that destroys the session is the classic mistake: a link prefetcher,
 * an antivirus scanning the page, or a browser preloading on hover will all
 * happily sign the user out for them.
 */
export function SignOutButton() {
  return (
    <form action={logoutAction}>
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground disabled:opacity-60"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
