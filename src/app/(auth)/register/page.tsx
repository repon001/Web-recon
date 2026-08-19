import type { Metadata } from "next";
import Link from "next/link";

import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Create an account" };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const { next } = await searchParams;
  const target = typeof next === "string" ? next : undefined;

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">Create an account</h1>
      <p className="mt-1 mb-6 text-sm text-muted">
        Registering signs you straight in — the backend returns tokens with the new
        account.
      </p>

      <RegisterForm next={target} />

      <p className="mt-6 text-center text-sm text-muted">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
