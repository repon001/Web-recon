import type { Metadata } from "next";

import { ScanListItem } from "@/components/scans/scan-list-item";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { listScans } from "@/lib/api/scans";
import { isActiveStatus } from "@/lib/api/types";
import { pluralise } from "@/lib/ui/format";

export const metadata: Metadata = { title: "Scans" };

const PAGE_SIZE = 20;

export default async function ScansPage({ searchParams }: PageProps<"/scans">) {
  const { offset } = await searchParams;
  const parsedOffset = Number(Array.isArray(offset) ? offset[0] : offset);
  const safeOffset = Number.isFinite(parsedOffset) && parsedOffset > 0 ? Math.floor(parsedOffset) : 0;

  const page = await listScans({ limit: PAGE_SIZE, offset: safeOffset });
  const running = page.items.filter((scan) => isActiveStatus(scan.status)).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Scans</h1>
          <p className="mt-0.5 text-sm text-muted">
            {page.total === 0
              ? "Nothing scanned yet."
              : `${pluralise(page.total, "scan")}${running > 0 ? `, ${running} still running` : ""}.`}
          </p>
        </div>
        <ButtonLink href="/scans/new">New scan</ButtonLink>
      </div>

      <Card className="overflow-hidden">
        <CardHeader
          title="History"
          description="Newest first. Open one for the full report."
        />

        {page.items.length === 0 ? (
          <EmptyState
            title="No scans yet"
            description="Point the scanner at a domain you own and it will grade the headers, hunt for files that should never have been deployed, and enumerate the subdomains."
            action={<ButtonLink href="/scans/new">Run the first scan</ButtonLink>}
          />
        ) : (
          <ul>
            {page.items.map((scan) => (
              <ScanListItem key={scan.id} scan={scan} />
            ))}
          </ul>
        )}

        <Pagination page={page} basePath="/scans" label="scans" />
      </Card>
    </div>
  );
}
