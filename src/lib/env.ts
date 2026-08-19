/**
 * Environment variables, parsed once and typed.
 *
 * The point of doing this in a module rather than reading `process.env` at the
 * call site is that a missing or malformed URL fails at import time with a
 * message naming the variable — not two hours later as an opaque `fetch failed`
 * in a Server Component.
 *
 * `process.env.X` must be written out in full: Next.js replaces those exact
 * strings at build time, so `process.env[name]` gets no substitution and the
 * public variable would be `undefined` in the browser.
 */
import { z } from "zod";

const serverSchema = z.object({
  API_BASE_URL: z.url().default("http://localhost:8000"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.url().default("http://localhost:8000"),
});

function parse<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }
  return result.data;
}

const clientEnv = parse(clientSchema, {
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

/** Base URL for the browser. Only the WebSocket needs it. */
export const publicApiBaseUrl = trimSlash(clientEnv.NEXT_PUBLIC_API_BASE_URL);

/**
 * Base URL for server-side code.
 *
 * A getter rather than a constant so that importing this module from a Client
 * Component — which cannot see server-only variables — does not throw. It only
 * fails if such a component actually tries to read it, which is the bug you
 * want reported.
 */
export function serverApiBaseUrl(): string {
  const env = parse(serverSchema, { API_BASE_URL: process.env.API_BASE_URL });
  return trimSlash(env.API_BASE_URL);
}

/** The same origin, spelled for a WebSocket: http -> ws, https -> wss. */
export function publicWebSocketBaseUrl(): string {
  return publicApiBaseUrl.replace(/^http/, "ws");
}

function trimSlash(url: string): string {
  return url.replace(/\/+$/, "");
}
