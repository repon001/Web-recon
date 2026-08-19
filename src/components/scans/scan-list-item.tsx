import Link from "next/link";

import { GradeBadge } from "@/components/scans/grade-badge";
import { ProgressBar } from "@/components/scans/progress-bar";
import { SeverityCountRow } from "@/components/scans/severity";
import { StatusBadge } from "@/components/scans/status-badge";
import { TimeAgo } from "@/components/ui/time-ago";
import { isActiveStatus, type ScanSummary } from "@/lib/api/types";
import { formatDuration, pluralise } from "@/lib/ui/format";

/**
 * One scan in the list.
 *
 * The whole row is a single link rather than a card with a "View" button: it
 * gives a much larger target, and it means one tab stop per scan instead of
 * three. Nothing else in the row is interactive, so there is no nested-control
 * problem to work around.
 */
export function ScanListItem({ scan }: { scan: ScanSummary }) {
  const active = isActiveStatus(scan.status);

  return (
    <li>
      <Link
        href={`/scans/${scan.id}`}
        className="flex gap-4 border-b border-border px-5 py-4 transition-colors last:border-b-0 hover:bg-surface-muted"
      >
        <GradeBadge grade={scan.grade} score={scan.score} />

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium text-foreground">{scan.domain}</span>
            <StatusBadge status={scan.status} />
            <span className="text-xs text-muted capitalize">{scan.profile}</span>
          </div>

          {active ? (
            <ProgressBar
              percent={scan.progress.percent}
              message={scan.progress.message}
              stage={scan.progress.stage}
              className="max-w-md"
            />
          ) : (
            <SeverityCountRow counts={scan.findings} />
          )}

          {scan.error ? <p className="text-xs text-danger">{scan.error}</p> : null}
        </div>

        <div className="hidden shrink-0 flex-col items-end gap-1 text-xs text-muted sm:flex">
          <TimeAgo iso={scan.created_at} />
          {scan.status === "completed" ? (
            <span>
              {pluralise(scan.subdomains_found, "subdomain")} · {formatDuration(scan.duration_ms)}
            </span>
          ) : null}
        </div>
      </Link>
    </li>
  );
}
