"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import * as authApi from "@/lib/api/auth";
import { ApiError, messageFor } from "@/lib/api/errors";
import { clearSession, setSession } from "@/lib/auth/session";

/**
 * Sign in, sign up, sign out.
 *
 * Server Actions rather than route handlers plus fetch, because the form then
 * works with JavaScript disabled and — more usefully — the password never
 * exists as a value in the client bundle's memory. `useActionState` on the
 * other side turns what these return into rendered errors.
 *
 * They return a state object instead of throwing: a thrown error in a Server
 * Action reaches production as "an error occurred in the Server Components
 * render", which tells the user nothing about their typo.
 */
export interface AuthState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

const registerSchema = z.object({
  email: z.email("Enter a valid email address."),
  // Matches the backend's own bound, so the common mistake is caught without a
  // round trip. The backend still enforces it — this is convenience, not
  // security.
  password: z.string().min(8, "Use at least 8 characters.").max(128),
  full_name: z.string().max(255).optional(),
});

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };

  try {
    const tokens = await authApi.login(parsed.data.email, parsed.data.password);
    await setSession(tokens);
  } catch (error) {
    return toState(error);
  }

  // Outside the try: `redirect` works by throwing, and a catch block would
  // swallow it and report a successful login as a failure.
  redirect(safeNext(formData.get("next")));
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const parsed = registerSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    full_name: fullName || undefined,
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };

  try {
    // Registration returns tokens along with the user, so there is no second
    // login round trip.
    const { tokens } = await authApi.register({
      email: parsed.data.email,
      password: parsed.data.password,
      full_name: parsed.data.full_name ?? null,
    });
    await setSession(tokens);
  } catch (error) {
    return toState(error);
  }

  redirect(safeNext(formData.get("next")));
}

export async function logoutAction(): Promise<void> {
  await clearSession();
  redirect("/login");
}

function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

/**
 * Map an API failure onto the form.
 *
 * A 422 carries per-field messages, and putting them under the field they
 * belong to is the difference between "fix your input" and a banner the user
 * has to decode.
 */
function toState(error: unknown): AuthState {
  if (error instanceof ApiError) {
    const fieldErrors = error.fieldErrors();
    if (Object.keys(fieldErrors).length > 0) return { fieldErrors };
    return { error: error.message };
  }
  return { error: messageFor(error) };
}

/**
 * Only ever redirect somewhere inside this app.
 *
 * `?next=` comes from the URL, so without this check anyone could send a link
 * that logs a user in and bounces them to a site of the attacker's choosing —
 * with the credibility of having just come from a real login page. Requiring a
 * single leading slash rejects both absolute URLs and the `//evil.com` form
 * that browsers treat as protocol-relative.
 */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  if (next.startsWith("/") && !next.startsWith("//")) return next;
  return "/scans";
}
