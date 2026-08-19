"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { createScanAction, type ScanFormState } from "@/lib/scans/actions";
import type { ScanProfile } from "@/lib/api/types";
import { cn } from "@/lib/ui/cn";

/** The time/coverage trade-off, in the words the README uses. */
const PROFILES: { value: ScanProfile; label: string; timing: string; detail: string }[] = [
  {
    value: "quick",
    label: "Quick",
    timing: "10–20s",
    detail: "Headers and exposed files only. No subdomain enumeration.",
  },
  {
    value: "standard",
    label: "Standard",
    timing: "30–90s",
    detail: "Adds passive sources and the first 120 wordlist entries.",
  },
  {
    value: "deep",
    label: "Deep",
    timing: "2–5 min",
    detail: "Adds the full brute-force wordlist. Slowest, most complete.",
  },
];

export function NewScanForm() {
  const [state, formAction] = useActionState<ScanFormState, FormData>(createScanAction, {});
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}

      <Field
        label="Domain"
        error={fieldErrors.domain}
        hint="A pasted URL is fine — it gets reduced to the host. Unicode domains are normalised to punycode."
      >
        {(props) => (
          <Input
            {...props}
            name="domain"
            placeholder="example.com"
            // The browser's own autocorrect fights domain entry on mobile.
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="url"
            required
          />
        )}
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-foreground">Profile</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {PROFILES.map((profile) => (
            <ProfileOption key={profile.value} {...profile} />
          ))}
        </div>
      </fieldset>

      <SubmitButton />
    </form>
  );
}

/**
 * A radio styled as a card.
 *
 * The input stays a real radio — visually hidden rather than replaced by a div
 * with an onClick — so arrow keys move between options, the label is clickable,
 * and the form still submits a `profile` value without JavaScript.
 */
function ProfileOption({
  value,
  label,
  timing,
  detail,
}: {
  value: ScanProfile;
  label: string;
  timing: string;
  detail: string;
}) {
  return (
    <label
      className={cn(
        "group flex cursor-pointer flex-col gap-1 rounded-lg border border-border bg-surface p-3",
        "transition-colors hover:border-muted/60",
        "has-checked:border-primary has-checked:bg-primary/5",
        "has-focus-visible:outline has-focus-visible:outline-2 has-focus-visible:outline-ring has-focus-visible:outline-offset-2",
      )}
    >
      <input
        type="radio"
        name="profile"
        value={value}
        defaultChecked={value === "standard"}
        className="sr-only"
      />
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted tabular-nums">{timing}</span>
      </div>
      <span className="text-xs leading-relaxed text-muted">{detail}</span>
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className="self-start">
      {pending ? "Starting…" : "Start scan"}
    </Button>
  );
}
