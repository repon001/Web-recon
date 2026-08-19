import "server-only";

import { cache } from "react";

import { getScan } from "@/lib/api/scans";

/**
 * One scan, fetched at most once per request.
 *
 * `generateMetadata` and the page body both need the scan, and both run for
 * every view. Without this that is two round trips for one page — Next only
 * dedupes `fetch` calls it is allowed to cache, and every scan read is
 * deliberately `no-store` because a running scan changes under us.
 *
 * React's `cache()` is the right tool precisely because its memo is scoped to
 * the request rather than to time: two readers in one render share a result,
 * and the next request still gets fresh data.
 */
export const getScanOnce = cache(getScan);
