/**
 * Cookie names and options, in a module with no server-only imports.
 *
 * Split out from `session.ts` because middleware runs in the Edge runtime and
 * cannot use `next/headers` — it reads and writes cookies off the request and
 * response objects instead. Both halves still have to agree on the names, and
 * agreeing via a shared constant beats agreeing by memory.
 */
export const ACCESS_COOKIE = "scanner_access";
export const REFRESH_COOKIE = "scanner_refresh";

/** Used only when a token's `exp` cannot be read; mirrors the backend defaults. */
export const ACCESS_FALLBACK_SECONDS = 60 * 30;
export const REFRESH_FALLBACK_SECONDS = 60 * 60 * 24 * 7;

export interface CookieOptions {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge?: number;
}

export function cookieOptions(maxAge?: number): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    // Off in development: localhost is plain http, and a Secure cookie there is
    // simply never stored — which presents as "login succeeds, then I'm logged
    // out again".
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(maxAge === undefined ? {} : { maxAge }),
  };
}
