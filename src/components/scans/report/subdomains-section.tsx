import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableScroll, Td, Th } from "@/components/ui/table";
import type { ScanResult, SubdomainRecord } from "@/lib/api/types";
import { pluralise } from "@/lib/ui/format";

/**
 * The hosts nobody remembers owning.
 *
 * Live names are listed before historical ones, and the difference is stated
 * rather than implied: certificate transparency proves a name *once existed*,
 * DNS proves it answers *now*. A staging box decommissioned two years ago is
 * history, not attack surface, and mixing the two inflates the number that
 * gets reported upward.
 */
export function SubdomainsSection({ result }: { result: ScanResult }) {
  const live = result.subdomains.filter((s) => s.resolves);
  const historical = result.subdomains.filter((s) => !s.resolves);
  const sources = result.subdomain_sources_used;

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title={<h2 className="text-sm font-semibold">Subdomains</h2>}
        description={
          sources.length > 0
            ? `${pluralise(result.subdomains.length, "name")} from ${sources.join(", ")}.`
            : "Enumeration did not run for this profile."
        }
      />

      {result.subdomains_truncated ? (
        <div className="px-5 pt-4">
          <Alert tone="warning">
            The list was clipped at the backend&rsquo;s maximum. There are more names than
            these — raise SCAN_MAX_SUBDOMAINS to see them all.
          </Alert>
        </div>
      ) : null}

      {result.subdomains.length === 0 ? (
        <EmptyState
          title="No subdomains found"
          description={
            sources.length === 0
              ? "The quick profile skips enumeration entirely. Run a standard or deep scan to enumerate."
              : "The passive sources and the wordlist both came back empty."
          }
        />
      ) : (
        <TableScroll>
          <Table>
            <thead>
              <tr>
                <Th className="w-full">Name</Th>
                <Th>Resolves to</Th>
                <Th>Sources</Th>
              </tr>
            </thead>
            <tbody>
              {[...live, ...historical].map((record) => (
                <SubdomainRow key={record.name} record={record} />
              ))}
            </tbody>
          </Table>
        </TableScroll>
      )}
    </Card>
  );
}

function SubdomainRow({ record }: { record: SubdomainRecord }) {
  return (
    <tr className={record.resolves ? undefined : "opacity-65"}>
      <Td className="font-mono text-xs break-anywhere">
        {record.name}
        {!record.resolves ? (
          <Badge className="ml-2" title="Seen by a passive source, but DNS no longer answers">
            historical
          </Badge>
        ) : null}
      </Td>
      <Td className="text-xs">
        {record.addresses.length > 0 ? (
          <ul className="font-mono">
            {record.addresses.map((address) => (
              <li key={address}>{address}</li>
            ))}
          </ul>
        ) : record.cname ? (
          <span className="font-mono text-muted">CNAME {record.cname}</span>
        ) : (
          <span className="text-muted">—</span>
        )}
      </Td>
      <Td>
        <div className="flex flex-wrap gap-1">
          {record.sources.map((source) => (
            <Badge key={source}>{source}</Badge>
          ))}
        </div>
      </Td>
    </tr>
  );
}
