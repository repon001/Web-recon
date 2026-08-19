"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { ApiError, messageFor } from "@/lib/api/errors";
import * as scansApi from "@/lib/api/scans";
import { SCAN_PROFILES, type ScanProfile } from "@/lib/api/types";

export interface ScanFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Validation deliberately thin on `domain`.
 *
 * The backend normalises whatever is pasted — `https://Example.COM/path`,
 * `example.com:8443`, `münchen.de` all reduce to one canonical host — and a
 * stricter regex here would reject input the engine handles perfectly well.
 * So this only catches "you left it blank", and the API owns the real rules.
 */
const createSchema = z.object({
  domain: z.string().min(4, "Enter a domain.").max(253, "That is too long to be a domain."),
  profile: z.enum(SCAN_PROFILES),
});

export async function createScanAction(
  _prev: ScanFormState,
  formData: FormData,
): Promise<ScanFormState> {
  const parsed = createSchema.safeParse({
    domain: String(formData.get("domain") ?? "").trim(),
    profile: String(formData.get("profile") ?? "standard"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { fieldErrors };
  }

  let scanId: string;
  try {
    const scan = await scansApi.createScan(parsed.data);
    scanId = scan.id;
  } catch (error) {
    return { error: explain(error) };
  }

  // The list is a cached Server Component render; without this the new scan is
  // missing from it until something else happens to invalidate the route.
  revalidatePath("/scans");
  redirect(`/scans/${scanId}`);
}

export async function cancelScanAction(scanId: string): Promise<void> {
  await scansApi.cancelScan(scanId);
  revalidatePath(`/scans/${scanId}`);
  revalidatePath("/scans");
}

export async function deleteScanAction(scanId: string): Promise<void> {
  await scansApi.deleteScan(scanId);
  revalidatePath("/scans");
  redirect("/scans");
}

/**
 * Turn the guard-rail errors into something actionable.
 *
 * The backend's messages are accurate but terse, and these three are the ones
 * a user hits by accident rather than by mistake — so each gets a sentence
 * saying what to do instead. Anything else falls through to the API's own
 * wording, which is better than a generic apology.
 */
/**
 * Run the same scan again.
 *
 * Deliberately a new scan rather than an in-place re-run: the old report stays
 * addressable, which is what makes "what changed since last week" answerable
 * at all. Overwriting would destroy the only copy of the comparison.
 */
export async function rescanAction(
  domain: string,
  profile: ScanProfile,
): Promise<{ error: string } | void> {
  let scanId: string;
  try {
    const scan = await scansApi.createScan({ domain, profile });
    scanId = scan.id;
  } catch (error) {
    return { error: explain(error) };
  }
  revalidatePath("/scans");
  redirect(`/scans/${scanId}`);
}

function explain(error: unknown): string {
  if (!(error instanceof ApiError)) return messageFor(error);

  switch (error.code) {
    case "invalid_target":
      return "That is not a domain the scanner will accept. IP addresses and bare hostnames are refused — use something like example.com.";
    case "target_not_allowed":
      return "Scanning that target is not permitted. Private addresses and reserved suffixes are blocked, and the backend may be restricted to an allowlist of domains you own.";
    case "target_not_resolvable":
      return "That domain does not resolve to any address. Check the spelling, or whether it has DNS records yet.";
    case "scan_limit_exceeded":
      return "You already have a scan running. Wait for it to finish, or cancel it first.";
    case "scan_rate_limited":
      return "Too many scans started recently. Give it a few minutes.";
    default:
      return error.message;
  }
}
