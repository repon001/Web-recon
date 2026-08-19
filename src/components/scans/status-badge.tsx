import { Badge, Dot } from "@/components/ui/badge";
import type { ScanStatus } from "@/lib/api/types";
import { cn } from "@/lib/ui/cn";

/**
 * Full class strings, not `text-${colour}`.
 *
 * Tailwind finds classes by scanning source text, so a name assembled at
 * runtime is never emitted and the badge renders unstyled — a bug that only
 * shows up in the production build, where the scan is the only source of
 * classes.
 */
const STATUS_STYLES: Record<ScanStatus, string> = {
  queued: "border-border bg-surface-muted text-muted",
  running: "border-low/30 bg-low/10 text-low",
  completed: "border-success/30 bg-success/10 text-success",
  failed: "border-danger/30 bg-danger/10 text-danger",
  cancelled: "border-border bg-surface-muted text-muted",
};

const STATUS_LABELS: Record<ScanStatus, string> = {
  queued: "Queued",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

export function StatusBadge({ status, className }: { status: ScanStatus; className?: string }) {
  const running = status === "running";
  return (
    <Badge className={cn(STATUS_STYLES[status], className)}>
      <Dot className={running ? "animate-pulse" : undefined} />
      {STATUS_LABELS[status]}
    </Badge>
  );
}
