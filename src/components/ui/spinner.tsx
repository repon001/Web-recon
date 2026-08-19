import { cn } from "@/lib/ui/cn";

/**
 * Pure CSS, no library.
 *
 * `aria-hidden` because a spinner is decoration: the surrounding element
 * carries `aria-busy` or a live region with the actual message, and a screen
 * reader announcing "image" here would add nothing.
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block size-4 shrink-0 animate-spin rounded-full",
        "border-2 border-current border-t-transparent opacity-70",
        className,
      )}
    />
  );
}
