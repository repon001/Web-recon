import { FindingCard } from "@/components/scans/report/finding-card";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SEVERITIES, type Finding } from "@/lib/api/types";
import { pluralise } from "@/lib/ui/format";

/**
 * Every finding, worst first.
 *
 * Sorted here rather than trusting the order the API happened to return, and
 * sorted by the backend's own severity ranking so "critical" cannot end up
 * below "high" because someone compared the strings alphabetically.
 */
export function FindingsSection({ findings }: { findings: Finding[] }) {
  const sorted = [...findings].sort(
    (a, b) => SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity),
  );
  const worst = sorted[0];

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title={<h2 className="text-sm font-semibold">Findings</h2>}
        description={
          sorted.length === 0
            ? "Nothing to report."
            : `${pluralise(sorted.length, "finding")}, worst first.${
                worst && worst.severity === "critical"
                  ? " A critical finding caps the grade at F on its own."
                  : ""
              }`
        }
      />
      {sorted.length === 0 ? (
        <EmptyState
          title="No findings"
          description="Nothing the scanner checks for was wrong. That is a narrower claim than 'secure' — this reports configuration and exposure, not vulnerabilities."
        />
      ) : (
        <ul>
          {sorted.map((finding, index) => (
            // `code` is stable but can repeat across categories (one per
            // affected host, say), so it is paired with the index.
            <FindingCard key={`${finding.code}-${index}`} finding={finding} />
          ))}
        </ul>
      )}
    </Card>
  );
}
