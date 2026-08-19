import { SEVERITY_STYLES, SeverityBadge } from "@/components/scans/severity";
import type { Finding } from "@/lib/api/types";
import { cn } from "@/lib/ui/cn";

const CATEGORY_LABELS: Record<Finding["category"], string> = {
  transport: "Transport",
  headers: "Headers",
  cookies: "Cookies",
  exposure: "Exposure",
  dns: "DNS",
  info: "Disclosure",
};

/**
 * One finding, with its evidence.
 *
 * Evidence is shown rather than hidden behind a toggle because a finding
 * without it is an opinion — the backend's own comment on the field. The
 * header value or the first bytes of the file are what turn "we think your
 * .env is exposed" into something a developer can act on without re-running
 * the scan by hand.
 */
export function FindingCard({ finding }: { finding: Finding }) {
  return (
    <li className="border-b border-border px-5 py-4 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2">
        <SeverityBadge severity={finding.severity} />
        <h3 className="font-medium text-foreground">{finding.title}</h3>
        <span className="ml-auto flex items-center gap-2 text-xs text-muted">
          <span>{CATEGORY_LABELS[finding.category]}</span>
          {finding.points > 0 ? (
            <span
              className="tabular-nums"
              title="Points this finding deducted from the score"
            >
              −{finding.points}
            </span>
          ) : null}
        </span>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-muted">{finding.detail}</p>

      {finding.evidence ? (
        <pre
          className={cn(
            "mt-3 overflow-x-auto rounded-lg border bg-surface-muted px-3 py-2",
            "font-mono text-xs leading-relaxed whitespace-pre-wrap break-anywhere",
            SEVERITY_STYLES[finding.severity],
          )}
        >
          {finding.evidence}
        </pre>
      ) : null}

      {finding.remediation ? (
        <p className="mt-3 text-sm text-foreground">
          <span className="font-medium">Fix: </span>
          <span className="text-muted">{finding.remediation}</span>
        </p>
      ) : null}

      {/*
        The stable identifier. Shown because clients — and people filing
        tickets — branch on the code, not on the title, which is free to change.
      */}
      <p className="mt-2 font-mono text-xs text-muted/70">{finding.code}</p>
    </li>
  );
}
