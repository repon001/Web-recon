import { cn } from "@/lib/ui/cn";

/**
 * The stage bar for a running scan.
 *
 * `role="progressbar"` with the aria value attributes, so this is not just a
 * coloured rectangle to anyone using a screen reader — the percentage and the
 * stage message are both announced.
 */
export function ProgressBar({
  percent,
  message,
  stage,
  className,
  tone = "primary",
}: {
  percent: number;
  message?: string;
  stage?: string;
  className?: string;
  tone?: "primary" | "muted";
}) {
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={stage ? `Scan progress: ${stage}` : "Scan progress"}
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500 ease-out",
            tone === "primary" ? "bg-primary" : "bg-muted",
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {message || stage ? (
        <div className="flex items-baseline justify-between gap-3 text-xs text-muted">
          <span className="min-w-0 truncate">{message ?? stage}</span>
          <span className="shrink-0 tabular-nums">{clamped}%</span>
        </div>
      ) : null}
    </div>
  );
}
