import Link from "next/link";

/**
 * The shell for signed-out pages.
 *
 * A route group — the `(auth)` folder adds nothing to the URL, so this layout
 * applies to /login and /register without either of them living under an
 * /auth/ prefix.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center gap-2.5">
          <ShieldMark />
          <span className="text-base font-semibold tracking-tight">Domain Scanner</span>
        </Link>
        {children}
      </div>
    </main>
  );
}

function ShieldMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 text-primary" aria-hidden="true">
      <path
        d="M12 2.5 4.5 5.5v6c0 4.6 3.1 8.6 7.5 10 4.4-1.4 7.5-5.4 7.5-10v-6L12 2.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="m8.75 12 2.25 2.25 4.25-4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
