import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableScroll, Td, Th } from "@/components/ui/table";
import type { ExposureRecord } from "@/lib/api/types";
import { formatBytes } from "@/lib/ui/format";
import { cn } from "@/lib/ui/cn";

/**
 * The probed paths and what came back.
 *
 * Confirmed and unconfirmed hits are both listed, separated. Many sites answer
 * 200 to every URL — single-page apps do it by design — so a 200 alone means
 * nothing; the backend fingerprints the site's not-found response and requires
 * a content signature before calling a hit real. Showing the unconfirmed ones
 * anyway lets a reader check that judgement rather than take it on trust.
 */
export function ExposuresSection({ exposures }: { exposures: ExposureRecord[] }) {
  const confirmed = exposures.filter((e) => e.confirmed && !e.informational);
  const informational = exposures.filter((e) => e.confirmed && e.informational);
  const unconfirmed = exposures.filter((e) => !e.confirmed);

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title={<h2 className="text-sm font-semibold">Exposed files</h2>}
        description="Paths probed after fingerprinting how this site answers a URL that does not exist."
      />

      {exposures.length === 0 ? (
        <EmptyState
          title="Nothing probed"
          description="No paths were checked — the site was not reachable over HTTP."
        />
      ) : confirmed.length === 0 && informational.length === 0 ? (
        <EmptyState
          title="Nothing exposed"
          description={`${unconfirmed.length} paths were probed and none of them returned the real thing.`}
        />
      ) : (
        <TableScroll>
          <Table>
            <thead>
              <tr>
                <Th className="w-full">Path</Th>
                <Th>Status</Th>
                <Th>Type</Th>
                <Th>Size</Th>
              </tr>
            </thead>
            <tbody>
              {[...confirmed, ...informational].map((exposure) => (
                <ExposureRow key={exposure.path} exposure={exposure} />
              ))}
            </tbody>
          </Table>
        </TableScroll>
      )}

      {unconfirmed.length > 0 && (confirmed.length > 0 || informational.length > 0) ? (
        <p className="border-t border-border px-5 py-3 text-xs text-muted">
          {unconfirmed.length} other paths were probed and did not return the real thing.
        </p>
      ) : null}
    </Card>
  );
}

function ExposureRow({ exposure }: { exposure: ExposureRecord }) {
  return (
    <tr>
      <Td>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={exposure.url}
            // The scanner found this because it is public; opening it should
            // not also hand the destination this app's URL in a Referer, nor a
            // window.opener handle to the tab it came from.
            target="_blank"
            rel="noreferrer noopener"
            className={cn(
              "font-mono text-xs hover:underline",
              exposure.informational ? "text-foreground" : "text-danger",
            )}
          >
            {exposure.path}
          </a>
          {exposure.informational ? (
            <Badge title="Meant to be public — listed for context, not as a problem">
              informational
            </Badge>
          ) : null}
        </div>
        {exposure.evidence ? (
          <pre className="mt-1.5 overflow-x-auto rounded border border-border bg-surface-muted px-2 py-1 font-mono text-xs whitespace-pre-wrap break-anywhere text-muted">
            {exposure.evidence}
          </pre>
        ) : null}
      </Td>
      <Td className="font-mono text-xs tabular-nums">{exposure.status_code}</Td>
      <Td className="text-xs whitespace-nowrap text-muted">{exposure.content_type ?? "—"}</Td>
      <Td className="text-xs whitespace-nowrap tabular-nums text-muted">
        {formatBytes(exposure.content_length)}
      </Td>
    </tr>
  );
}
