import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/ui/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-xl border border-border bg-surface", className)}
      {...props}
    />
  );
}

/**
 * A card header with an optional right-hand slot for actions.
 *
 * `title` is a ReactNode rather than a string so a caller can put a heading of
 * the right level in it. Baking in an `<h2>` here would produce documents whose
 * heading levels jump around depending on where the card was reused.
 */
export function CardHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function CardBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}
