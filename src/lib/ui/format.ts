/**
 * Formatting helpers, all pure so they work on either side of the boundary.
 *
 * Fixed to `en-GB` rather than the visitor's locale on purpose: a locale-aware
 * format is resolved from the OS on the client and from the server's own
 * environment during SSR, and when those disagree React reports a hydration
 * mismatch on a date nobody was reading anyway.
 */
const LOCALE = "en-GB";

const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return `${dateTimeFormat.format(date)} UTC`;
}

/** Coarse "how long ago", in the units a human would pick. */
export function formatRelative(iso: string | null | undefined, now: number = Date.now()): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";

  const seconds = Math.round((now - then) / 1000);
  if (seconds < 45) return "just now";

  const units: [limit: number, seconds: number, name: Intl.RelativeTimeFormatUnit][] = [
    [60, 1, "second"],
    [3600, 60, "minute"],
    [86400, 3600, "hour"],
    [604800, 86400, "day"],
    [2629800, 604800, "week"],
    [31557600, 2629800, "month"],
    [Infinity, 31557600, "year"],
  ];

  const absolute = Math.abs(seconds);
  for (const [limit, size, unit] of units) {
    if (absolute < limit) {
      const value = Math.round(seconds / size);
      return new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" }).format(-value, unit);
    }
  }
  return formatDateTime(iso);
}

/** Milliseconds as the scanner reports them: "8.4s", "1m 23s". */
export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;

  const totalSeconds = ms / 1000;
  if (totalSeconds < 60) return `${totalSeconds.toFixed(1)}s`;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
}

/** Byte counts from Content-Length. */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || Number.isNaN(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[index]}`;
}

export function pluralise(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
