/**
 * Reading the `exp` claim out of a JWT, without verifying it.
 *
 * Not verifying is the correct thing here and worth being explicit about: this
 * app is not the token's audience, the backend is. It re-checks the signature
 * on every request, so nothing is trusted on the strength of what this returns.
 * The only use is scheduling — "is it worth refreshing before I call?" — and a
 * forged expiry can at worst cost one wasted round trip.
 *
 * Runs in the Edge runtime (middleware), so no Buffer and no `jsonwebtoken`.
 */

interface JwtClaims {
  exp?: number;
  sub?: string;
  type?: string;
}

export function decodeClaims(token: string): JwtClaims | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
}

/** Seconds until the token expires. Negative once it has. */
export function secondsUntilExpiry(token: string): number | null {
  const exp = decodeClaims(token)?.exp;
  if (typeof exp !== "number") return null;
  return exp - Math.floor(Date.now() / 1000);
}

/**
 * Refresh a little early rather than exactly on time.
 *
 * The margin covers the round trip plus clock skew between this process and the
 * backend. Without it, a token that is valid when middleware checks it can be
 * expired by the time the API reads it — a 401 that looks random and is not.
 */
const EXPIRY_MARGIN_SECONDS = 60;

export function isExpired(token: string): boolean {
  const remaining = secondsUntilExpiry(token);
  // A token whose expiry cannot be read is treated as still good: the backend
  // is the authority, and guessing "expired" here would log people out for a
  // parse bug.
  if (remaining === null) return false;
  return remaining <= EXPIRY_MARGIN_SECONDS;
}
