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
 * The `live` prop decides whether this is announced when it appears, and it is
 * a separate question from the colour. An alert that was on the page all along
 * — "only scan what you are allowed to scan" — is ordinary content, and marking
 * it as a live region makes a screen reader interrupt itself to read a standing
 * notice on every single page load. An alert that appeared *because the user
 * just did something* is the opposite: if it is not announced, a keyboard user
 * who submitted a form gets no feedback at all.
 *
 * So the default is "live only if this is an error", since an error tone is
 * almost always a response to an action, and everything else opts in.
 */
export function Alert({
  tone = "info",
  title,
  children,
  className,
  live,
}: {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** Announce this when it appears. Defaults to true for the danger tone. */
  live?: boolean;
}) {
  const announce = live ?? tone === "danger";

  // `alert` interrupts; `status` waits for a pause. Something that went wrong
  // earns the interruption, a confirmation does not.
  const role = announce ? (tone === "danger" || tone === "warning" ? "alert" : "status") : undefined;

  return (
    <div
      role={role}
      className={cn("rounded-lg border px-3.5 py-3 text-sm", TONES[tone], className)}
    >
      {title ? <div className="font-medium">{title}</div> : null}
      {children ? <div className={cn(title && "mt-1", "opacity-90")}>{children}</div> : null}
    </div>
  );
}
