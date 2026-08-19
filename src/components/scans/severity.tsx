import { Badge } from "@/components/ui/badge";
import { SEVERITIES, type Severity, type SeverityCounts } from "@/lib/api/types";
import { cn } from "@/lib/ui/cn";

export const SEVERITY_STYLES: Record<Severity, string> = {
  critical: "border-critical/30 bg-critical/10 text-critical",
  high: "border-high/30 bg-high/10 text-high",
  medium: "border-medium/30 bg-medium/10 text-medium",
  low: "border-low/30 bg-low/10 text-low",
  info: "border-border bg-surface-muted text-muted",
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Info",
};

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  return (
    <Badge className={cn(SEVERITY_STYLES[severity], className)}>
      {SEVERITY_LABELS[severity]}
    </Badge>
  );
}

/**
 * The severity breakdown for a scan row.
 *
 * Zeroes are dropped rather than rendered as "0 critical", because a row of
 * five counters that are mostly zero reads as noise and hides the one number
 * that is not. If everything is zero the caller gets an explicit all-clear
 * instead of an empty gap.
 */
export function SeverityCountRow({
  counts,
  className,
}: {
  counts: SeverityCounts;
  className?: string;
}) {
  const present = SEVERITIES.filter((severity) => (counts[severity] ?? 0) > 0);

  if (present.length === 0) {
    return <span className={cn("text-xs text-muted", className)}>No findings</span>;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {present.map((severity) => (
        <span
          key={severity}
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium tabular-nums",
            SEVERITY_STYLES[severity],
          )}
        >
          {counts[severity]}
          <span className="opacity-75">{SEVERITY_LABELS[severity].toLowerCase()}</span>
        </span>
      ))}
    </div>
  );
}
