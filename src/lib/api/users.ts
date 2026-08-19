import "server-only";

import { apiFetch } from "@/lib/api/client";
import type { Page, User } from "@/lib/api/types";

/**
 * The signed-in user.
 *
 * `no-store` because this is what decides whether the nav shows an account or a
 * sign-in link. Next.js would otherwise be free to serve one user's cached
 * profile to the next request, which is the single worst caching bug an app
 * like this can have.
 */
export function getCurrentUser(): Promise<User> {
  return apiFetch<User>("/users/me", { cache: "no-store" });
}

export function updateCurrentUser(input: {
  email?: string;
  full_name?: string | null;
  password?: string;
}): Promise<User> {
  return apiFetch<User>("/users/me", { method: "PATCH", body: input });
}

/** Admin only — the backend answers 403 for everyone else. */
export function listUsers(params: { limit?: number; offset?: number } = {}): Promise<Page<User>> {
  return apiFetch<Page<User>>("/users", { query: params, cache: "no-store" });
}
