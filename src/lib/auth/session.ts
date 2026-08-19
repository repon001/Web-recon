import "server-only";

import { cookies } from "next/headers";

import type { TokenPair } from "@/lib/api/types";
import {
  ACCESS_COOKIE,
  ACCESS_FALLBACK_SECONDS,
  cookieOptions,
  REFRESH_COOKIE,
  REFRESH_FALLBACK_SECONDS,
} from "@/lib/auth/cookies";
import { secondsUntilExpiry } from "@/lib/auth/jwt";

/**
 * Reading and writing the session, from Server Actions and Route Handlers.
 *
 * Note what is *not* here: nothing hands the access token to the browser. It is
 * httpOnly, so no script on the page can read it — which matters because an XSS
 * bug that can read a token keeps working long after the tab is closed. The one
 * place the browser genuinely needs it is the progress WebSocket, and that goes
 * through a route handler that mints it on demand.
 */
export { ACCESS_COOKIE, REFRESH_COOKIE };

/**
 * Cookie lifetime taken from the token's own `exp`.
 *
 * Hard-coding 30 minutes would mean editing this file every time the backend's
 * ACCESS_TOKEN_EXPIRE_MINUTES changes, and being quietly wrong until someone
 * noticed sessions ending early.
 */
function maxAgeFor(token: string, fallback: number): number {
  const remaining = secondsUntilExpiry(token);
  return remaining !== null && remaining > 0 ? remaining : fallback;
}

export async function setSession(tokens: TokenPair): Promise<void> {
  const store = await cookies();
  store.set(
    ACCESS_COOKIE,
    tokens.access_token,
    cookieOptions(maxAgeFor(tokens.access_token, ACCESS_FALLBACK_SECONDS)),
  );
  store.set(
    REFRESH_COOKIE,
    tokens.refresh_token,
    cookieOptions(maxAgeFor(tokens.refresh_token, REFRESH_FALLBACK_SECONDS)),
  );
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

export async function getAccessToken(): Promise<string | undefined> {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  return (await cookies()).get(REFRESH_COOKIE)?.value;
}

/** Cheap "is anyone signed in?" for layouts, without a round trip to the API. */
export async function hasSession(): Promise<boolean> {
  const store = await cookies();
  return Boolean(store.get(ACCESS_COOKIE)?.value ?? store.get(REFRESH_COOKIE)?.value);
}
