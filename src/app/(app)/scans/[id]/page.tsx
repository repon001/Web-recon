import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GradeBadge } from "@/components/scans/grade-badge";
import { LiveScanProgress } from "@/components/scans/live-scan-progress";
import { ExposuresSection } from "@/components/scans/report/exposures-section";
import { FindingsSection } from "@/components/scans/report/findings-section";
import { HeadersSection } from "@/components/scans/report/headers-section";
import { SubdomainsSection } from "@/components/scans/report/subdomains-section";
import { TransportSection } from "@/components/scans/report/transport-section";
import { ScanActions } from "@/components/scans/scan-actions";
import { SeverityCountRow } from "@/components/scans/severity";
import { StatusBadge } from "@/components/scans/status-badge";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody } from "@/components/ui/card";
import { TimeAgo } from "@/components/ui/time-ago";
import { ApiError } from "@/lib/api/errors";
import { getScan } from "@/lib/api/scans";
import { isActiveStatus, type Scan } from "@/lib/api/types";
import { formatDateTime, formatDuration } from "@/lib/ui/format";

export async function generateMetadata({ params }: PageProps<"/scans/[id]">): Promise<Metadata> {
  const { id } = await params;
  try {
    const scan = await getScan(id);
    return { title: `${scan.domain} · ${scan.grade ?? scan.status}` };
  } catch {
    // A title is not worth failing the page over; the page's own fetch will
    // produce the real 404.
    return { title: "Scan" };
  }
}

export default async function ScanPage({ params }: PageProps<"/scans/[id]">) {
  const { id } = await params;

  let scan: Scan;
  try {
    scan = await getScan(id);
  } catch (error) {
    // The backend answers 404 for someone else's scan too, never 403 — so ids
    // cannot be probed. Rendering the same not-found page keeps that property.
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const active = isActiveStatus(scan.status);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/scans" className="text-sm text-muted hover:text-foreground">
          ← All scans
        </Link>
      </div>

      <Card>
        <CardBody className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 gap-4">
            <GradeBadge grade={scan.grade} score={scan.score} size="lg" />
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight">{scan.domain}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <StatusBadge status={scan.status} />
                <span className="text-xs text-muted capitalize">{scan.profile} profile</span>
              </div>
              <p className="mt-2 text-xs text-muted">
                Started <TimeAgo iso={scan.started_at ?? scan.created_at} />
                {scan.finished_at ? (
                  <>
                    {" · "}
                    {formatDuration(scan.duration_ms)}
                    {" · "}
                    <span title={formatDateTime(scan.finished_at)}>
                      finished <TimeAgo iso={scan.finished_at} />
                    </span>
                  </>
                ) : null}
              </p>
            </div>
          </div>

          <ScanActions
            scanId={scan.id}
            domain={scan.domain}
            profile={scan.profile}
            status={scan.status}
          />
        </CardBody>

        {!active && scan.result ? (
          <div className="border-t border-border px-5 py-3">
            <SeverityCountRow counts={scan.findings} />
          </div>
        ) : null}
      </Card>

      {scan.status === "failed" ? (
        <Alert tone="danger" title="The scan failed">
          {scan.error ?? "No reason was recorded."}
        </Alert>
      ) : null}

      {scan.status === "cancelled" ? (
        <Alert tone="info" title="Cancelled">
          This scan was stopped before it finished, so the report below is partial.
        </Alert>
      ) : null}

      {active ? (
        /*
          Keyed on the scan id so navigating between two running scans tears the
          socket down and opens a new one, rather than reusing the component and
          streaming the wrong scan into it.
        */
        <LiveScanProgress
          key={scan.id}
          scanId={scan.id}
          status={scan.status}
          progress={scan.progress}
        />
      ) : scan.result ? (
        <>
          <FindingsSection findings={scan.result.findings} />
          <TransportSection result={scan.result} />
          <HeadersSection
            headerChecks={scan.result.header_checks}
            cookies={scan.result.cookies}
          />
          <ExposuresSection exposures={scan.result.exposures} />
          <SubdomainsSection result={scan.result} />
          <p className="text-xs text-muted">
            Score {scan.result.score} of 100, graded {scan.result.grade}. Deductions are
            capped per category, and the worst single finding caps the letter — so twenty
            missing headers cannot outweigh one leaked <code className="font-mono">.env</code>.
            This reports configuration and exposure, not vulnerabilities.
          </p>
        </>
      ) : (
        <Card>
          <CardBody className="text-sm text-muted">
            No report was produced. The scan ended before it reached the grading stage.
          </CardBody>
        </Card>
      )}
    </div>
  );
}
