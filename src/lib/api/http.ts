import "server-only";

import { serverApiBaseUrl } from "@/lib/env";
import { ApiError, NetworkError } from "@/lib/api/errors";

/**
 * The one place a request leaves for the backend.
 *
 * `server-only` at the top is load-bearing: it makes the build fail if a Client
 * Component ever imports this, which is what stops an access token being pulled
 * into the browser bundle by an innocent-looking import.
 *
 * Everything here is deliberately dumb — no retries, no token handling, no
 * refresh. Those live one layer up in `client.ts`, so this function stays
 * usable for the unauthenticated calls (login, register) too.
 */

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  /** Serialised as JSON. Mutually exclusive with `form`. */
  body?: unknown;
  /** Serialised as x-www-form-urlencoded, which is what /auth/login wants. */
  form?: Record<string, string>;
  token?: string;
  query?: Record<string, string | number | undefined>;
  /**
   * Next.js fetch cache options. Scan data changes under us constantly, so
   * callers pass `{ cache: "no-store" }`; anything omitted keeps Next's default.
   */
  cache?: RequestCache;
  next?: { revalidate?: number | false; tags?: string[] };
  signal?: AbortSignal;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, form, token, query, cache, next, signal } = options;

  const url = new URL(`${serverApiBaseUrl()}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const headers: Record<string, string> = { accept: "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (form) {
    headers["content-type"] = "application/x-www-form-urlencoded";
    payload = new URLSearchParams(form).toString();
  } else if (body !== undefined) {
    headers["content-type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(url, { method, headers, body: payload, cache, next, signal });
  } catch (cause) {
    // An AbortSignal firing is a caller's decision, not a backend outage, so it
    // is re-thrown as-is rather than disguised as a network failure.
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
    throw new NetworkError(cause);
  }

  if (!response.ok) throw await toApiError(response);

  // 204 on delete, and 202 on cancel with a body. Reading `.json()` on an empty
  // body throws, so the length is checked rather than the status.
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

/**
 * Read the error envelope, falling back sanely when there isn't one.
 *
 * A 502 from a proxy in front of the API returns HTML, not our envelope, and
 * the client should still produce a usable ApiError instead of a JSON parse
 * failure that hides the real status.
 */
async function toApiError(response: Response): Promise<ApiError> {
  let code = `http_${response.status}`;
  let message = response.statusText || "Request failed.";
  let details: unknown = null;

  try {
    const parsed = (await response.json()) as {
      error?: { code?: string; message?: string; details?: unknown };
      detail?: unknown;
    };
    if (parsed?.error) {
      code = parsed.error.code ?? code;
      message = parsed.error.message ?? message;
      details = parsed.error.details ?? null;
    } else if (typeof parsed?.detail === "string") {
      // Raw HTTPException — /ready raises one of these.
      message = parsed.detail;
    }
  } catch {
    // Not JSON. Keep the status-derived defaults.
  }

  return new ApiError(response.status, code, message, details);
}
