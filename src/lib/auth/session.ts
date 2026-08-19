import "server-only";

import { cookies } from "next/headers";

import type { TokenPair } from "@/lib/api/types";
import { secondsUntilExpiry } from "@/lib/auth/jwt";

/**
 * Where the tokens live.
 *
 * httpOnly, so no script on the page can read them — which matters because an
 * XSS bug that can read a token can keep using the account long after the tab
 * is closed. The cost is that the WebSocket, which needs the token in its query
 * string, has to ask the server for it (see the ws-ticket route handler).
 *
 * sameSite=lax rather than strict so that following a link into the app from an
 * email still arrives logged in. There is no cross-site POST worth protecting
 * here — every mutation is a Server Action, and Next.js already guards those
 * with an Origin check.
 */
export const ACCESS_COOKIE = "scanner_access";
export const REFRESH_COOKIE = "scanner_refresh";

const REFRESH_FALLBACK_SECONDS = 60 * 60 * 24 * 7;
const ACCESS_FALLBACK_SECONDS = 60 * 30;

function baseCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    // Off in development, because localhost is served over plain http and a
    // Secure cookie would simply never be stored.
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

/**
 * Cookie lifetime taken from the token's own `exp`.
 *
 * Hard-coding 30 minutes here would mean editing this file every time the
 * backend's ACCESS_TOKEN_EXPIRE_MINUTES changes, and being subtly wrong until
 * someone noticed.
 */
function maxAgeFor(token: string, fallback: number): number {
  const remaining = secondsUntilExpiry(token);
  return remaining !== null && remaining > 0 ? remaining : fallback;
}

export async function setSession(tokens: TokenPair): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_COOKIE, tokens.access_token, {
    ...baseCookieOptions(),
    maxAge: maxAgeFor(tokens.access_token, ACCESS_FALLBACK_SECONDS),
  });
  store.set(REFRESH_COOKIE, tokens.refresh_token, {
    ...baseCookieOptions(),
    maxAge: maxAgeFor(tokens.refresh_token, REFRESH_FALLBACK_SECONDS),
  });
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
