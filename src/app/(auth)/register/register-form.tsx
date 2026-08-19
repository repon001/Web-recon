"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { registerAction, type AuthState } from "@/lib/auth/actions";

export function RegisterForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState<AuthState, FormData>(registerAction, {});
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}

      <Field label="Name" error={fieldErrors.full_name} hint="Optional.">
        {(props) => (
          <Input {...props} name="full_name" autoComplete="name" placeholder="Ada Lovelace" />
        )}
      </Field>

      <Field label="Email" error={fieldErrors.email}>
        {(props) => (
          <Input
            {...props}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        )}
      </Field>

      <Field
        label="Password"
        error={fieldErrors.password}
        hint="At least 8 characters."
      >
        {(props) => (
          <Input
            {...props}
            name="password"
            type="password"
            // `new-password` rather than `current-password`, which is what
            // prompts a password manager to offer to generate and save one.
            autoComplete="new-password"
            placeholder="••••••••"
            minLength={8}
            required
          />
        )}
      </Field>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className="mt-1 w-full">
      {pending ? "Creating account…" : "Create account"}
    </Button>
  );
}
