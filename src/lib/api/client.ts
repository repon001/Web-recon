import "server-only";

import { ApiError } from "@/lib/api/errors";
import { request, type RequestOptions } from "@/lib/api/http";
import { getAccessToken } from "@/lib/auth/session";

/** Everything versioned lives under here; /health and /ready do not. */
export const API_V1 = "/api/v1";

/**
 * A request that carries the signed-in user's access token.
 *
 * There is no refresh-and-retry here on purpose. Refreshing means writing new
 * cookies, and Next.js only allows that in a Server Action or Route Handler —
 * never while a Server Component renders. So the refresh happens once per
 * request in `middleware.ts`, before any of this runs, and by the time a page
 * calls `apiFetch` the token in the cookie is already fresh.
 *
 * A 401 escaping from here therefore means the session is genuinely gone, not
 * that it merely aged out, and the right response is to sign the user out.
 */
export async function apiFetch<T>(
  path: string,
  options: Omit<RequestOptions, "token"> = {},
): Promise<T> {
  const token = await getAccessToken();
  if (!token) {
    throw new ApiError(401, "invalid_credentials", "Your session has expired. Sign in again.");
  }
  return request<T>(`${API_V1}${path}`, { ...options, token });
}

/** A request with no token — register, login, refresh. */
export async function publicFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return request<T>(`${API_V1}${path}`, options);
}
