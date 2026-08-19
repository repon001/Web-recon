import "server-only";

import { refresh as refreshApi } from "@/lib/api/auth";
import { isExpired } from "@/lib/auth/jwt";
import { getAccessToken, getRefreshToken, setSession } from "@/lib/auth/session";

/**
 * A usable access token, refreshing first if the current one is spent.
 *
 * Middleware already does this for page requests, but it is excluded from
 * `/api/*` — a redirect to an HTML login page is a useless answer to a fetch
 * that wanted JSON. Route handlers are allowed to write cookies, so they can
 * do the same job for themselves, and this is that job.
 *
 * Returns null rather than throwing when there is nothing to work with; the
 * caller decides what status that deserves.
 */
export async function ensureAccessToken(): Promise<string | null> {
  const access = await getAccessToken();
  if (access && !isExpired(access)) return access;

  const refreshToken = await getRefreshToken();
  if (!refreshToken || isExpired(refreshToken)) return null;

  try {
    const tokens = await refreshApi(refreshToken);
    await setSession(tokens);
    return tokens.access_token;
  } catch {
    return null;
  }
}
