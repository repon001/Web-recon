import "server-only";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/api/users";
import { ApiError } from "@/lib/api/errors";
import type { User } from "@/lib/api/types";

/**
 * The signed-in user, or a redirect to the login page.
 *
 * Middleware has already turned away anyone with no usable token, so reaching
 * this and getting a 401 means something narrower: the account was deleted or
 * deactivated while the token was still inside its lifetime. Rare, but it
 * renders as a crashed page rather than a sign-out if nothing handles it.
 *
 * Only 401 is swallowed. A 500 from the backend is a real failure and should
 * reach the error boundary, not be disguised as "please sign in again" — which
 * would send the user round a login loop that cannot succeed.
 */
export async function requireUser(): Promise<User> {
  try {
    return await getCurrentUser();
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) redirect("/login");
    throw error;
  }
}
