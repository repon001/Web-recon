import { NextResponse, type NextRequest } from "next/server";

import {
  ACCESS_COOKIE,
  ACCESS_FALLBACK_SECONDS,
  cookieOptions,
  REFRESH_COOKIE,
  REFRESH_FALLBACK_SECONDS,
} from "@/lib/auth/cookies";
import { isExpired, secondsUntilExpiry } from "@/lib/auth/jwt";

/**
 * Route protection, and the one place the access token is refreshed.
 *
 * Refreshing has to happen here rather than in the API client, because writing
 * a cookie is only legal in middleware, a Route Handler or a Server Action —
 * never while a Server Component renders. Middleware runs before all three, so
 * doing it here means every downstream reader sees a fresh token and no page
 * ever has to handle "expired" as a special case.
 *
 * The refresh result is written twice on purpose: onto the *request*, so the
 * page rendering right now uses the new token, and onto the *response*, so the
 * browser stops sending the old one.
 */

/** Reachable signed out. Everything else needs a session. */
const PUBLIC_PATHS = ["/login", "/register"];

/** Where a freshly signed-in user lands. */
const HOME_PATH = "/scans";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  // Usable without asking the backend anything.
  let usableAccess = accessToken && !isExpired(accessToken) ? accessToken : undefined;
  let refreshed: TokenPairLike | null = null;

  if (!usableAccess && refreshToken && !isExpired(refreshToken)) {
    refreshed = await exchangeRefreshToken(refreshToken);
    usableAccess = refreshed?.access_token;
  }

  if (!usableAccess) {
    if (isPublic) return NextResponse.next();
    // Nothing to work with. Send them to sign in, remembering where they were
    // headed so the round trip is invisible.
    const target = new URL("/login", request.url);
    if (pathname !== "/") target.searchParams.set("next", `${pathname}${search}`);
    return clearSession(NextResponse.redirect(target));
  }

  if (isPublic) {
    // Already signed in; the login form would only confuse.
    return applyRefresh(NextResponse.redirect(new URL(HOME_PATH, request.url)), refreshed);
  }

  if (!refreshed) return NextResponse.next();

  // Let the current render see the new token without a second round trip.
  request.cookies.set(ACCESS_COOKIE, refreshed.access_token);
  request.cookies.set(REFRESH_COOKIE, refreshed.refresh_token);
  return applyRefresh(NextResponse.next({ request }), refreshed);
}

interface TokenPairLike {
  access_token: string;
  refresh_token: string;
}

/**
 * Trade a refresh token for a new pair.
 *
 * Returns null on *any* failure, including the backend being down. That is the
 * safe direction: a null sends the user to the login page, whereas throwing
 * would surface a 500 on every route at once the moment the API restarts.
 */
async function exchangeRefreshToken(refreshToken: string): Promise<TokenPairLike | null> {
  // Written out in full rather than read from lib/env, because middleware runs
  // in the Edge runtime where only literally-referenced variables are inlined.
  const baseUrl = process.env.API_BASE_URL ?? "http://localhost:8000";
  try {
    const response = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as TokenPairLike;
  } catch {
    return null;
  }
}

function applyRefresh(response: NextResponse, tokens: TokenPairLike | null): NextResponse {
  if (!tokens) return response;
  response.cookies.set(
    ACCESS_COOKIE,
    tokens.access_token,
    cookieOptions(maxAgeFor(tokens.access_token, ACCESS_FALLBACK_SECONDS)),
  );
  response.cookies.set(
    REFRESH_COOKIE,
    tokens.refresh_token,
    cookieOptions(maxAgeFor(tokens.refresh_token, REFRESH_FALLBACK_SECONDS)),
  );
  return response;
}

function maxAgeFor(token: string, fallback: number): number {
  const remaining = secondsUntilExpiry(token);
  return remaining !== null && remaining > 0 ? remaining : fallback;
}

/** Expire both cookies, so a dead session is not retried on every navigation. */
function clearSession(response: NextResponse): NextResponse {
  response.cookies.set(ACCESS_COOKIE, "", cookieOptions(0));
  response.cookies.set(REFRESH_COOKIE, "", cookieOptions(0));
  return response;
}

export const config = {
  /**
   * Skip static assets and Next's own internals.
   *
   * `api` is excluded too: the route handlers under it do their own cookie
   * reading, and a redirect to an HTML login page is a useless answer to a
   * fetch that wanted JSON.
   */
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\.svg$).*)"],
};
