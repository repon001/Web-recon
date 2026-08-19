import type { ComponentProps } from "react";

import { cn } from "@/lib/ui/cn";

/**
 * A table that survives a narrow screen.
 *
 * The scroll container is part of the component rather than left to callers,
 * because a report table with an eight-column certificate subject in it will
 * otherwise push the whole page sideways — and a horizontally scrolling body
 * is far worse than a horizontally scrolling table.
 */
export function TableScroll({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("w-full overflow-x-auto", className)} {...props} />;
}

export function Table({ className, ...props }: ComponentProps<"table">) {
  return <table className={cn("w-full text-left text-sm", className)} {...props} />;
}

export function Th({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-border px-5 py-2.5 text-xs font-medium whitespace-nowrap text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: ComponentProps<"td">) {
  return (
    <td className={cn("border-b border-border px-5 py-2.5 align-top", className)} {...props} />
  );
}

/** A label/value pair, for the panels where a table would be overkill. */
export function DataRow({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 py-2 sm:flex-row sm:items-baseline sm:gap-4",
        className,
      )}
    >
      <dt className="w-44 shrink-0 text-xs text-muted">{label}</dt>
      <dd className="min-w-0 text-sm break-anywhere text-foreground">{children}</dd>
    </div>
  );
}
