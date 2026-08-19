import { NextResponse, type NextRequest } from "next/server";

import { ensureAccessToken } from "@/lib/auth/refresh";

/**
 * Hand the page a token it can put in a WebSocket URL.
 *
 * This is the one crack in the httpOnly cookie, and it is here because the
 * browser WebSocket API has no way to set a header — there is no options
 * argument — so every browser client either puts the token in the URL or
 * invents its own authenticate-after-connect handshake. The backend chose the
 * query string; this endpoint is the frontend half of that decision.
 *
 * What it buys over simply not using httpOnly: the token is never in
 * `document.cookie`, so it is not swept up by a generic cookie-stealing
 * payload, and it only exists in JS memory on the one page that needs it. What
 * it does not buy: immunity from an XSS that specifically calls this endpoint.
 * That is a real limit and worth stating rather than glossing.
 */
export async function GET(request: NextRequest) {
  // Same-origin only. A cross-site page can already read this response body
  // only if CORS allows it — which it does not — but rejecting the request
  // outright means the token is never even minted for one.
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") {
    return NextResponse.json(
      { error: { code: "forbidden", message: "Cross-site requests are refused.", details: null } },
      { status: 403 },
    );
  }

  const token = await ensureAccessToken();
  if (!token) {
    return NextResponse.json(
      { error: { code: "invalid_credentials", message: "Not signed in.", details: null } },
      { status: 401 },
    );
  }

  return NextResponse.json(
    { token },
    // Never cached, anywhere. A CDN or a browser holding this would serve one
    // user's token to the next.
    { headers: { "cache-control": "no-store, private" } },
  );
}
