import "server-only";

import { apiFetch } from "@/lib/api/client";
import type { Page, Scan, ScanCreate, ScanSummary } from "@/lib/api/types";

/**
 * Every read here is `no-store`.
 *
 * A scan changes several times a second while it runs, and the whole point of
 * the list and detail pages is to show that. Next.js caches `fetch` by route
 * segment, so without this a revisit would render a two-minute-old progress bar
 * that never moves.
 */
export function listScans(params: { limit?: number; offset?: number } = {}) {
  return apiFetch<Page<ScanSummary>>("/scans", { query: params, cache: "no-store" });
}

export function getScan(scanId: string): Promise<Scan> {
  return apiFetch<Scan>(`/scans/${scanId}`, { cache: "no-store" });
}

/** 202 Accepted: the scan exists but has not run yet. */
export function createScan(input: ScanCreate): Promise<Scan> {
  return apiFetch<Scan>("/scans", { method: "POST", body: input });
}

/**
 * Ask a running scan to stop.
 *
 * Also 202 — the task notices the request when it next comes up for air, so the
 * summary this returns can still say "running". The WebSocket reports the
 * actual transition.
 */
export function cancelScan(scanId: string): Promise<ScanSummary> {
  return apiFetch<ScanSummary>(`/scans/${scanId}/cancel`, { method: "POST" });
}

export function deleteScan(scanId: string): Promise<void> {
  return apiFetch<void>(`/scans/${scanId}`, { method: "DELETE" });
}
