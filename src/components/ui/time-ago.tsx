"use client";

import { useEffect, useState } from "react";

import { formatDateTime, formatRelative } from "@/lib/ui/format";

/**
 * "3 minutes ago", without a hydration mismatch.
 *
 * The server renders the absolute timestamp, because a relative one computed
 * during SSR is already stale by the time it reaches the browser and React
 * flags the difference. After mount the text switches to the relative form and
 * refreshes on a timer, so a list left open does not slowly start lying.
 *
 * The absolute value stays in `title` and in the `dateTime` attribute either
 * way, which is what a screen reader and a copy-paste both want.
 */
export function TimeAgo({ iso, className }: { iso: string | null; className?: string }) {
  const [relative, setRelative] = useState<string | null>(null);

  useEffect(() => {
    if (!iso) return;
    const update = () => setRelative(formatRelative(iso));
    update();
    // A minute is fine: nothing here is measured more finely than that once it
    // is older than a minute, and a per-second timer on a long list is waste.
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
  }, [iso]);

  if (!iso) return <span className={className}>—</span>;

  return (
    <time dateTime={iso} title={formatDateTime(iso)} className={className}>
      {relative ?? formatDateTime(iso)}
    </time>
  );
}
