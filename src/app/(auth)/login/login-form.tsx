"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { loginAction, type AuthState } from "@/lib/auth/actions";

/**
 * `useActionState` wires the form to the Server Action and hands back whatever
 * it returned — so the error rendering below is the same object the action
 * built, with no client-side duplicate of the validation rules.
 */
export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState<AuthState, FormData>(loginAction, {});
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* Carried through the POST so the action knows where to send them. */}
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}

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

      <Field label="Password" error={fieldErrors.password}>
        {(props) => (
          <Input
            {...props}
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
          />
        )}
      </Field>

      <SubmitButton />
    </form>
  );
}

/**
 * Split into its own component because `useFormStatus` reads the status of the
 * nearest parent form — called in `LoginForm` itself it would always report
 * idle, since that component is the form rather than inside it.
 */
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className="mt-1 w-full">
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}
