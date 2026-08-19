import Link from "next/link";

import { NavLink } from "@/components/layout/nav-link";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { requireUser } from "@/lib/auth/require-user";

/**
 * The shell every signed-in page renders inside.
 *
 * Fetching the user here rather than in each page means one request per
 * navigation instead of one per page that happens to want an email address —
 * and it is the layout that decides whether there is a session at all.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4">
          <Link href="/scans" className="mr-2 flex items-center gap-2 font-semibold tracking-tight">
            <ShieldMark />
            <span className="hidden sm:inline">Domain Scanner</span>
          </Link>

          <nav aria-label="Main" className="flex items-center gap-1">
            <NavLink href="/scans" exact>
              Scans
            </NavLink>
            <NavLink href="/scans/new">New scan</NavLink>
            <NavLink href="/settings">Settings</NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <span
              className="hidden max-w-45 truncate text-sm text-muted md:inline"
              title={user.email}
            >
              {user.full_name || user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}

function ShieldMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 text-primary" aria-hidden="true">
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
