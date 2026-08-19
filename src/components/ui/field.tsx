"use client";

// `useId` is a client hook, so the whole module renders on the client. That is
// no loss: every control in here lives inside an interactive form anyway.
import type { ComponentProps, ReactNode } from "react";
import { useId } from "react";

import { cn } from "@/lib/ui/cn";

/**
 * A labelled form control with its error and hint wired up.
 *
 * The wiring is the reason this exists. `aria-describedby` and
 * `aria-invalid` have to point at real ids, and hand-writing them per field is
 * how they end up pointing at nothing. `useId` generates ids that match between
 * the server render and the client hydration, which `Math.random()` would not.
 */
export function Field({
  label,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  error?: string;
  hint?: ReactNode;
  children: (props: {
    id: string;
    "aria-invalid"?: true;
    "aria-describedby"?: string;
  }) => ReactNode;
  className?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children({
        id,
        ...(error ? { "aria-invalid": true as const } : {}),
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
      })}
      {hint ? (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm",
        "text-foreground placeholder:text-muted/70",
        "transition-colors hover:border-muted/50",
        "aria-invalid:border-danger",
        "disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-10 w-full appearance-none rounded-lg border border-border bg-surface px-3 text-sm",
        "text-foreground transition-colors hover:border-muted/50",
        "aria-invalid:border-danger disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
