import type { ReactNode } from "react";

import { cn } from "@/lib/ui/cn";

type Tone = "danger" | "warning" | "success" | "info";

const TONES: Record<Tone, string> = {
  danger: "border-danger/30 bg-danger/10 text-danger",
  warning: "border-warning/30 bg-warning/10 text-warning",
  success: "border-success/30 bg-success/10 text-success",
  info: "border-border bg-surface-muted text-muted",
};

/**
 * A message the user needs to notice.
 *
 * `role="alert"` on the error tones only. It interrupts a screen reader
 * mid-sentence, which is right for "that password was wrong" and rude for a
 * hint that was on the page all along.
 */
export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const assertive = tone === "danger" || tone === "warning";
  return (
    <div
      role={assertive ? "alert" : undefined}
      className={cn("rounded-lg border px-3.5 py-3 text-sm", TONES[tone], className)}
    >
      {title ? <div className="font-medium">{title}</div> : null}
      {children ? <div className={cn(title && "mt-1", "opacity-90")}>{children}</div> : null}
    </div>
  );
}
