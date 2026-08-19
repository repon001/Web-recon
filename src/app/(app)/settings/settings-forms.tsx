"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import type { User } from "@/lib/api/types";
import {
  updatePasswordAction,
  updateProfileAction,
  type ProfileState,
} from "@/lib/users/actions";

/**
 * Two forms, not one.
 *
 * A single form would send the password on every name change, which means the
 * password field either has to be left blank and specially interpreted, or
 * pre-filled — and pre-filling a password field is how browsers end up saving
 * the wrong one. Separating them also means a validation failure on one cannot
 * discard the other's input.
 */
export function ProfileForm({ user }: { user: User }) {
  const [state, formAction] = useActionState<ProfileState, FormData>(
    updateProfileAction,
    {},
  );
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <Field label="Name" error={fieldErrors.full_name} hint="Leave blank to remove it.">
        {(props) => (
          <Input
            {...props}
            name="full_name"
            autoComplete="name"
            defaultValue={user.full_name ?? ""}
            placeholder="Ada Lovelace"
          />
        )}
      </Field>

      <Field label="Email" error={fieldErrors.email}>
        {(props) => (
          <Input
            {...props}
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={user.email}
            required
          />
        )}
      </Field>

      <SubmitButton idle="Save changes" busy="Saving…" />
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction] = useActionState<ProfileState, FormData>(
    updatePasswordAction,
    {},
  );
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <Field label="New password" error={fieldErrors.password} hint="At least 8 characters.">
        {(props) => (
          <Input
            {...props}
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        )}
      </Field>

      <Field label="Confirm new password" error={fieldErrors.confirm}>
        {(props) => (
          <Input
            {...props}
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
          />
        )}
      </Field>

      <SubmitButton idle="Change password" busy="Changing…" />
    </form>
  );
}

function SubmitButton({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className="self-start">
      {pending ? busy : idle}
    </Button>
  );
}
