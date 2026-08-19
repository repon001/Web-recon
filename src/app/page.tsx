import type { Metadata } from "next";
import Link from "next/link";

import { GradeBadge } from "@/components/scans/grade-badge";
import { SeverityBadge } from "@/components/scans/severity";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { hasSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Domain Scanner",
  description:
    "Enumerate subdomains, grade security headers, and find the files that should never have been deployed. One letter grade for the person who authorises the fix.",
};

/**
 * The front door.
 *
 * Rendered for signed-out and signed-in visitors alike — middleware lets `/`
 * through untouched — so the only thing the session decides is which call to
 * action the header shows.
 */
export default async function LandingPage() {
  const signedIn = await hasSession();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader signedIn={signedIn} />

      <main className="flex-1">
        <Hero signedIn={signedIn} />
        <Pipeline />
        <Accuracy />
        <Grading />
        <Profiles />
        <Authorisation />
      </main>

      <SiteFooter />
    </div>
  );
}

// ------------------------------------------------------------------ chrome --
function SiteHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <ShieldMark />
          Domain Scanner
        </Link>

        <nav aria-label="Sections" className="ml-auto hidden items-center gap-1 sm:flex">
          <a
            href="#how-it-works"
            className="rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            How it works
          </a>
          <a
            href="#grading"
            className="rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            Grading
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          {signedIn ? (
            <ButtonLink href="/scans" size="sm">
              Go to scans
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" size="sm">
                Sign in
              </ButtonLink>
              <ButtonLink href="/register" size="sm">
                Get started
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-muted">
        <p>
          A FastAPI backend and a Next.js frontend. Reports configuration and exposure —
          not vulnerabilities.
        </p>
        <div className="flex gap-4">
          <Link href="/login" className="hover:text-foreground">
            Sign in
          </Link>
          <Link href="/register" className="hover:text-foreground">
            Create an account
          </Link>
        </div>
      </div>
    </footer>
  );
}

// -------------------------------------------------------------------- hero --
function Hero({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 pt-16 pb-14 sm:pt-24">
      <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <Badge className="mb-5">Scan domains you own</Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Find what you already published by accident.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
            Point it at a domain and it enumerates the subdomains, grades every security
            header, hunts for files that should never have been deployed, and returns one
            letter grade — streaming progress over a WebSocket while it works.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {signedIn ? (
              <>
                <ButtonLink href="/scans/new">Start a scan</ButtonLink>
                <ButtonLink href="/scans" variant="secondary">
                  See your reports
                </ButtonLink>
              </>
            ) : (
              <>
                <ButtonLink href="/register">Create an account</ButtonLink>
                <ButtonLink href="/login" variant="secondary">
                  Sign in
                </ButtonLink>
              </>
            )}
          </div>

          <p className="mt-5 text-xs text-muted">
            Every check here exists because of a real failure.
          </p>
        </div>

        <ReportPreview />
      </div>
    </section>
  );
}

/**
 * A preview of the real report, built from the real components.
 *
 * Not a screenshot: the grade badge and severity pills below are the same ones
 * the scan page renders, so this cannot drift out of date the way an exported
 * image does — and it inherits the dark palette for free.
 */
function ReportPreview() {
  return (
    <Card className="overflow-hidden shadow-sm">
      <CardBody className="flex items-center gap-4 border-b border-border">
        <GradeBadge grade="F" score={24} size="lg" />
        <div className="min-w-0">
          <p className="truncate font-medium">example.com</p>
          <p className="mt-0.5 text-xs text-muted">standard profile · 31.4s · 7 findings</p>
        </div>
      </CardBody>

      <ul className="divide-y divide-border text-sm">
        {[
          { severity: "critical" as const, title: "/.env is readable", points: 60 },
          { severity: "high" as const, title: "No HSTS header", points: 20 },
          { severity: "high" as const, title: "Dangling CNAME on staging", points: 20 },
          { severity: "medium" as const, title: "No Content-Security-Policy", points: 10 },
        ].map((finding) => (
          <li key={finding.title} className="flex items-center gap-3 px-5 py-2.5">
            <SeverityBadge severity={finding.severity} />
            <span className="min-w-0 flex-1 truncate text-foreground">{finding.title}</span>
            <span className="shrink-0 text-xs text-muted tabular-nums">
              −{finding.points}
            </span>
          </li>
        ))}
      </ul>

      <p className="border-t border-border px-5 py-3 text-xs text-muted">
        A critical finding caps the grade at F on its own.
      </p>
    </Card>
  );
}

// ------------------------------------------------------------------ stages --
const STAGES = [
  {
    range: "0–10%",
    title: "Resolve",
    detail: "A, AAAA, NS and MX records, plus SPF and DMARC.",
    learn: "Where the domain points, and whether anyone can send mail as it.",
  },
  {
    range: "10–30%",
    title: "Transport",
    detail: "The TLS handshake, then http:// and https:// fetched separately.",
    learn: "Certificate validity and expiry, TLS version, whether HTTP redirects.",
  },
  {
    range: "30–50%",
    title: "Headers",
    detail: "One redirect hop followed, then every security header graded.",
    learn: "HSTS, CSP, framing, referrer, CORS, cookie flags, version disclosure.",
  },
  {
    range: "50–70%",
    title: "Exposures",
    detail: "19 paths probed, after fingerprinting the site's own 404 behaviour.",
    learn: ".env, .git, dumps, backups, debug endpoints.",
  },
  {
    range: "70–95%",
    title: "Subdomains",
    detail: "subfinder and amass if installed, crt.sh, then DNS brute force.",
    learn: "The hosts nobody remembers owning.",
  },
  {
    range: "100%",
    title: "Grade",
    detail: "Findings weighted, deductions capped per category, turned into a letter.",
    learn: "One number for the person who authorises the fix.",
  },
];

function Pipeline() {
  return (
    <Section
      id="how-it-works"
      eyebrow="How it works"
      title="Six stages, in this order"
      lede="Enumeration runs last on purpose. It is by far the slowest stage, so watching the socket gets you the headers and exposure findings — the part you asked about — long before the scan finishes."
    >
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STAGES.map((stage, index) => (
          <li key={stage.title}>
            <Card className="h-full">
              <CardBody>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold">
                    <span className="mr-2 text-muted tabular-nums">{index + 1}</span>
                    {stage.title}
                  </span>
                  <span className="text-xs text-muted tabular-nums">{stage.range}</span>
                </div>
                <p className="mt-2 text-sm text-muted">{stage.detail}</p>
                <p className="mt-2 border-t border-border pt-2 text-xs text-muted">
                  {stage.learn}
                </p>
              </CardBody>
            </Card>
          </li>
        ))}
      </ol>
    </Section>
  );
}

// ---------------------------------------------------------------- accuracy --
const DEFENCES = [
  {
    title: "Soft 404s",
    problem:
      "Many sites answer every URL with 200 — single-page apps do it by design. A scanner that trusts the status code reports thirty critical findings, all of them the same HTML file.",
    defence:
      "Two random paths are fetched first to fingerprint the not-found response, and every probe is checked against it. On top of that each probe carries a content signature: /.env counts only when the body really holds KEY=value lines.",
  },
  {
    title: "Wildcard DNS",
    problem:
      "If *.example.com resolves then so does definitely-not-real-a83f4.example.com, and a brute-forcer discovers every word in its list.",
    defence:
      "Several random names are resolved before the run, and any hit pointing only at those addresses is dropped.",
  },
  {
    title: "History vs live surface",
    problem:
      "Certificate transparency proves a name once existed; DNS proves it resolves now. A staging box decommissioned two years ago is history, not attack surface.",
    defence:
      "Every record carries both its sources and a resolves flag, and only live hosts are assessed.",
  },
];

function Accuracy() {
  return (
    <Section
      eyebrow="Accuracy"
      title="The three ways home-made scanners are wrong"
      lede="Each has a defence here, and each has tests behind it."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {DEFENCES.map((item) => (
          <Card key={item.title} className="h-full">
            <CardBody>
              <h3 className="text-sm font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.problem}</p>
              <p className="mt-3 border-t border-border pt-3 text-sm leading-relaxed text-foreground">
                {item.defence}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>
    </Section>
  );
}

// ----------------------------------------------------------------- grading --
const SEVERITY_ROWS = [
  { severity: "critical" as const, points: "60", ceiling: "F" },
  { severity: "high" as const, points: "20", ceiling: "C" },
  { severity: "medium" as const, points: "10", ceiling: "B+" },
  { severity: "low" as const, points: "3", ceiling: "—" },
  { severity: "info" as const, points: "0", ceiling: "—" },
];

function Grading() {
  return (
    <Section
      id="grading"
      eyebrow="Grading"
      title="A grade is a lie, usefully told"
      lede="Score starts at 100. Each finding deducts by severity, deductions are capped per category, and the worst single finding caps the letter."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th scope="col" className="border-b border-border px-5 py-2.5 text-xs font-medium text-muted">
                  Severity
                </th>
                <th scope="col" className="border-b border-border px-5 py-2.5 text-xs font-medium text-muted">
                  Points
                </th>
                <th scope="col" className="border-b border-border px-5 py-2.5 text-xs font-medium text-muted">
                  Grade ceiling
                </th>
              </tr>
            </thead>
            <tbody>
              {SEVERITY_ROWS.map((row) => (
                <tr key={row.severity}>
                  <td className="border-b border-border px-5 py-2.5">
                    <SeverityBadge severity={row.severity} />
                  </td>
                  <td className="border-b border-border px-5 py-2.5 tabular-nums">
                    {row.points}
                  </td>
                  <td className="border-b border-border px-5 py-2.5 tabular-nums">
                    {row.ceiling}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardBody>
              <h3 className="text-sm font-semibold">Category caps</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Twenty missing headers cannot outweigh one leaked{" "}
                <code className="font-mono text-xs">.env</code>. Without a cap you get
                death by papercuts, which is what makes home-made scoring feel arbitrary.
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <h3 className="text-sm font-semibold">Grade ceilings</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                A site with an exposed <code className="font-mono text-xs">.env</code>{" "}
                cannot grade a B because everything else was tidy. An attacker holding
                your database credentials does not care about your CSP.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------- profiles --
const PROFILES = [
  { name: "Quick", timing: "10–20s", detail: "Headers and exposed files. No enumeration." },
  {
    name: "Standard",
    timing: "30–90s",
    detail: "Adds passive sources and the first 120 wordlist entries.",
  },
  { name: "Deep", timing: "2–5 min", detail: "Adds the full brute-force wordlist." },
];

function Profiles() {
  return (
    <Section
      eyebrow="Profiles"
      title="Trade time for coverage"
      lede="The domain field takes what people actually paste: https://Example.COM/path, example.com:8443 and münchen.de all normalise to one canonical host."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {PROFILES.map((profile) => (
          <Card key={profile.name} className="h-full">
            <CardBody>
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold">{profile.name}</h3>
                <span className="text-xs text-muted tabular-nums">{profile.timing}</span>
              </div>
              <p className="mt-2 text-sm text-muted">{profile.detail}</p>
            </CardBody>
          </Card>
        ))}
      </div>
    </Section>
  );
}

// ----------------------------------------------------------- authorisation --
function Authorisation() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 pt-4 pb-20">
      <Card className="border-warning/30 bg-warning/5">
        <CardBody className="sm:px-8 sm:py-7">
          <h2 className="text-lg font-semibold tracking-tight">
            Only scan what you are allowed to scan
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
            This makes real requests to real servers. Doing that to infrastructure you
            neither own nor have written permission to test is, in most jurisdictions,
            unauthorised access — regardless of how gentle the requests are.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
            Legitimate targets: your own domains, a lab you built, something inside a bug
            bounty programme&rsquo;s stated scope, or a client who has signed a statement
            of work. That is not a formality. The difference between a scanner and an
            attack is authorisation, and nothing else.
          </p>
        </CardBody>
      </Card>
    </section>
  );
}

// ----------------------------------------------------------------- helpers --
function Section({
  id,
  eyebrow,
  title,
  lede,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  lede: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      // Scroll margin, so an anchored heading is not hidden under the sticky
      // header when someone follows one of the nav links.
      className="mx-auto w-full max-w-5xl scroll-mt-20 border-t border-border px-4 py-16"
    >
      <p className="text-xs font-medium tracking-wide text-primary uppercase">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-balance">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{lede}</p>
      <div className="mt-8">{children}</div>
    </section>
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
