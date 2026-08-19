"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ApiError, messageFor } from "@/lib/api/errors";
import { updateCurrentUser } from "@/lib/api/users";

export interface ProfileState {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
}

const profileSchema = z.object({
  email: z.email("Enter a valid email address."),
  full_name: z.string().max(255, "That name is too long.").optional(),
});

const passwordSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters.").max(128),
    confirm: z.string(),
  })
  // Confirmation is a frontend-only rule — the API takes a single password —
  // and it exists because a typo in a password field is invisible and locks
  // you out of your own account.
  .refine((value) => value.password === value.confirm, {
    message: "The two passwords do not match.",
    path: ["confirm"],
  });

export async function updateProfileAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const parsed = profileSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    full_name: fullName,
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };

  try {
    await updateCurrentUser({
      email: parsed.data.email,
      // An empty box means "clear it", which is null on the wire — not "".
      full_name: fullName === "" ? null : fullName,
    });
  } catch (error) {
    return toState(error);
  }

  // The header renders the name, so it has to re-render too — hence the layout
  // path rather than just this page.
  revalidatePath("/", "layout");
  return { success: "Profile updated." };
}

export async function updatePasswordAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const parsed = passwordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };

  try {
    await updateCurrentUser({ password: parsed.data.password });
  } catch (error) {
    return toState(error);
  }

  // Existing tokens keep working: the backend does not revoke them on a
  // password change, so there is nothing to sign out here.
  return { success: "Password changed." };
}

function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

function toState(error: unknown): ProfileState {
  if (error instanceof ApiError) {
    const fieldErrors = error.fieldErrors();
    if (Object.keys(fieldErrors).length > 0) return { fieldErrors };
    return { error: error.message };
  }
  return { error: messageFor(error) };
}
