import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  // `searchParams` is a promise in the App Router: awaiting it is what marks
  // this page as dynamic rather than prerendered at build time.
  const { next } = await searchParams;
  const target = typeof next === "string" ? next : undefined;

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1 mb-6 text-sm text-muted">
        Scan domains you own, and keep the reports.
      </p>

      <LoginForm next={target} />

      <p className="mt-6 text-center text-sm text-muted">
        No account?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create one
        </Link>
      </p>
    </>
  );
}
