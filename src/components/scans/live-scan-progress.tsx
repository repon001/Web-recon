"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { FindingCard } from "@/components/scans/report/finding-card";
import { ProgressBar } from "@/components/scans/progress-bar";
import { Alert } from "@/components/ui/alert";
import { Badge, Dot } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { SEVERITIES, type ScanProgress, type ScanStatus } from "@/lib/api/types";
import { useScanStream, type StreamPhase } from "@/lib/scans/use-scan-stream";
import { cn } from "@/lib/ui/cn";
import { pluralise } from "@/lib/ui/format";

/**
 * The pipeline, in the order the backend runs it.
 *
 * Enumeration is last on purpose — it is by far the slowest stage, so putting
 * it there means the headers and exposure findings, which are the part people
 * actually asked about, arrive long before the scan finishes.
 */
const STAGES = [
  { key: "resolve", label: "Resolve", detail: "A, AAAA, NS, MX, SPF, DMARC" },
  { key: "transport", label: "Transport", detail: "TLS handshake, http and https" },
  { key: "headers", label: "Headers", detail: "Security headers and cookies" },
  { key: "exposures", label: "Exposures", detail: "19 paths, soft-404 filtered" },
  { key: "subdomains", label: "Subdomains", detail: "Passive sources and brute force" },
  { key: "grading", label: "Grade", detail: "Findings weighted into a letter" },
] as const;

export function LiveScanProgress({
  scanId,
  status,
  progress,
}: {
  scanId: string;
  status: ScanStatus;
  progress: ScanProgress;
}) {
  const router = useRouter();

  /**
   * Re-render the Server Component to pick up the finished report.
   *
   * `router.refresh()` rather than a client-side fetch: the page already knows
   * how to render a scan from the server, and duplicating that in the browser
   * would be a second copy of every report section to keep in step.
   */
  const reload = useCallback(() => router.refresh(), [router]);

  const stream = useScanStream({
    scanId,
    initialStatus: status,
    initialProgress: progress,
    active: true,
    onTerminal: reload,
  });

  const currentIndex = STAGES.findIndex((stage) => stage.key === stream.progress.stage);
  const sorted = [...stream.findings].sort(
    (a, b) => SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity),
  );

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader
          title={<h2 className="text-sm font-semibold">Running</h2>}
          description="Progress streams over a WebSocket. Leaving the page does not stop the scan."
          actions={<ConnectionBadge phase={stream.phase} />}
        />
        <CardBody className="flex flex-col gap-5">
          <ProgressBar
            percent={stream.progress.percent}
            message={stream.progress.message}
            stage={stream.progress.stage}
          />

          <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {STAGES.map((stage, index) => (
              <StageItem
                key={stage.key}
                label={stage.label}
                detail={stage.detail}
                state={
                  currentIndex < 0
                    ? "pending"
                    : index < currentIndex
                      ? "done"
                      : index === currentIndex
                        ? "active"
                        : "pending"
                }
              />
            ))}
          </ol>

          {/*
            A polite live region, so a screen reader hears the stage change
            without being interrupted mid-sentence every few seconds.
          */}
          <p aria-live="polite" className="sr-only">
            {stream.progress.stage}: {stream.progress.message}
          </p>
        </CardBody>
      </Card>

      {stream.lagged ? (
        <Alert tone="warning" title="Some events were dropped" live>
          The server&rsquo;s queue for this connection overflowed, so the list below may be
          missing findings. The finished report will be complete.
        </Alert>
      ) : null}

      {stream.phase === "offline" ? (
        <Alert tone="warning" title="Live updates unavailable" live>
          The progress socket could not be reopened, so this page is polling instead.
          The scan itself is unaffected.
        </Alert>
      ) : null}

      <Card className="overflow-hidden">
        <CardHeader
          title={<h2 className="text-sm font-semibold">Findings so far</h2>}
          description={
            sorted.length === 0
              ? "Findings appear here the moment the scanner discovers them."
              : `${pluralise(sorted.length, "finding")} so far. The full report replaces this when the scan ends.`
          }
        />
        {sorted.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted">
            Nothing found yet.
          </div>
        ) : (
          <ul>
            {sorted.map((finding, index) => (
              <FindingCard key={`${finding.code}-${index}`} finding={finding} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function StageItem({
  label,
  detail,
  state,
}: {
  label: string;
  detail: string;
  state: "done" | "active" | "pending";
}) {
  return (
    <li
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3 py-2",
        state === "active"
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-surface",
        state === "pending" && "opacity-55",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border text-[0.625rem]",
          state === "done"
            ? "border-success bg-success text-white"
            : state === "active"
              ? "animate-pulse border-primary bg-primary text-white"
              : "border-border text-transparent",
        )}
      >
        ✓
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="block text-xs text-muted">{detail}</span>
      </span>
    </li>
  );
}

const PHASE_LABELS: Record<StreamPhase, string> = {
  connecting: "Connecting",
  live: "Live",
  reconnecting: "Reconnecting",
  finished: "Finished",
  offline: "Polling",
};

function ConnectionBadge({ phase }: { phase: StreamPhase }) {
  const tone =
    phase === "live"
      ? "border-success/30 bg-success/10 text-success"
      : phase === "offline"
        ? "border-warning/30 bg-warning/10 text-warning"
        : "border-border bg-surface-muted text-muted";

  return (
    <Badge className={tone}>
      <Dot className={phase === "live" ? "animate-pulse" : undefined} />
      {PHASE_LABELS[phase]}
    </Badge>
  );
}
