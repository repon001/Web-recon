import Link from "next/link";
import type { ComponentProps } from "react";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/ui/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover border-transparent shadow-sm",
  secondary: "bg-surface text-foreground hover:bg-surface-muted border-border",
  ghost: "bg-transparent text-muted hover:text-foreground hover:bg-surface-muted border-transparent",
  danger: "bg-transparent text-danger hover:bg-danger/10 border-border",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
};

function classesFor(variant: Variant, size: Size, className?: string): string {
  return cn(
    "inline-flex items-center justify-center rounded-lg border font-medium",
    "transition-colors select-none",
    // `disabled:` covers the button; `aria-disabled` covers the link, which
    // cannot be disabled and is instead made inert by the handler.
    "disabled:pointer-events-none disabled:opacity-55 aria-disabled:pointer-events-none aria-disabled:opacity-55",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button
      // Buttons inside a form default to type="submit", which turns a stray
      // "Cancel" into an accidental submission. Callers can still override it.
      type="button"
      className={classesFor(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

/** Same skin on a real anchor, so navigation stays a link and keeps its menu. */
export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={classesFor(variant, size, className)} {...props} />;
}
