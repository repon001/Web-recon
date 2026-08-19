import type { ComponentProps } from "react";

import { cn } from "@/lib/ui/cn";

/**
 * A small status pill.
 *
 * Colour is passed in as a token name rather than a full class string so that
 * callers cannot invent a colour outside the palette — and so Tailwind can see
 * every class it needs to emit, which it cannot do for a runtime-built
 * `bg-${x}` string.
 */
export function Badge({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5",
        "text-xs font-medium whitespace-nowrap",
        "border-border bg-surface-muted text-muted",
        className,
      )}
      {...props}
    />
  );
}

/** A filled dot, for statuses where the colour is the whole message. */
export function Dot({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("size-1.5 rounded-full bg-current", className)} />;
}
