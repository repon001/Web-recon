import { cn } from "@/lib/ui/cn";

/**
 * A placeholder block.
 *
 * `aria-hidden`, and the surrounding page carries the "loading" announcement —
 * otherwise a screen reader reads out a dozen meaningless boxes. A skeleton is
 * for the eye only.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-surface-muted", className)}
    />
  );
}
