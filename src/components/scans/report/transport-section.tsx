import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DataRow } from "@/components/ui/table";
import type { HttpTarget, ScanResult, TlsInfo } from "@/lib/api/types";
import { formatDateTime } from "@/lib/ui/format";
import { cn } from "@/lib/ui/cn";

/**
 * What the domain resolves to, and what answered.
 *
 * DNS and transport are shown together because the questions run into each
 * other: "where does this point" and "what is listening there" are one
 * investigation, and splitting them across two cards makes the reader hop.
 */
export function TransportSection({ result }: { result: ScanResult }) {
  const { tls, http, https } = result;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader
          title={<h2 className="text-sm font-semibold">DNS</h2>}
          description="Where the domain points, and who can send mail as it."
        />
        <CardBody>
          <dl className="divide-y divide-border">
            <DataRow label="Addresses">
              {result.resolved_ips.length > 0 ? (
                <ul className="font-mono text-xs">
                  {result.resolved_ips.map((ip) => (
                    <li key={ip}>{ip}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-muted">None</span>
              )}
            </DataRow>
            <DataRow label="Nameservers">
              {result.nameservers.length > 0 ? (
                <ul className="font-mono text-xs">
                  {result.nameservers.map((ns) => (
                    <li key={ns}>{ns}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-muted">None</span>
              )}
            </DataRow>
            <DataRow label="MX records">
              {result.mx_records.length > 0 ? (
                <ul className="font-mono text-xs">
                  {result.mx_records.map((mx) => (
                    <li key={mx}>{mx}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-muted">None — this domain does not receive mail</span>
              )}
            </DataRow>
            {result.wildcard_dns ? (
              <DataRow label="Wildcard DNS">
                <span className="text-warning">
                  Present. Any name under this domain resolves, so brute-forced results
                  were filtered against it.
                </span>
              </DataRow>
            ) : null}
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={<h2 className="text-sm font-semibold">Transport</h2>}
          description="The TLS handshake, and both schemes fetched separately."
        />
        <CardBody>
          <dl className="divide-y divide-border">
            <TlsRows tls={tls} />
            <SchemeRow label="HTTP" target={http} />
            <SchemeRow label="HTTPS" target={https} />
          </dl>
        </CardBody>
      </Card>
    </div>
  );
}

function TlsRows({ tls }: { tls: TlsInfo | null }) {
  if (!tls) return <DataRow label="TLS">Not checked.</DataRow>;

  // An error here means the handshake failed, which is itself one of the more
  // serious things this scanner can find — so it replaces the detail rows
  // rather than sitting underneath them.
  if (tls.error || !tls.supported) {
    return (
      <DataRow label="TLS">
        <span className="text-danger">{tls.error ?? "No TLS on port 443."}</span>
      </DataRow>
    );
  }

  const days = tls.days_until_expiry;
  const expiryTone =
    days === null ? "" : days < 14 ? "text-danger" : days < 30 ? "text-warning" : "";

  return (
    <>
      <DataRow label="Protocol">
        <span className="font-mono text-xs">{tls.protocol ?? "—"}</span>
        {tls.cipher ? (
          <span className="ml-2 font-mono text-xs text-muted">{tls.cipher}</span>
        ) : null}
      </DataRow>
      <DataRow label="Certificate">
        <div className="font-mono text-xs">{tls.subject ?? "—"}</div>
        {tls.issuer ? <div className="mt-0.5 text-xs text-muted">{tls.issuer}</div> : null}
      </DataRow>
      <DataRow label="Expires">
        <span className={cn("text-sm", expiryTone)}>
          {formatDateTime(tls.not_after)}
          {days !== null ? ` · ${days} days` : ""}
        </span>
      </DataRow>
    </>
  );
}

function SchemeRow({ label, target }: { label: string; target: HttpTarget | null }) {
  if (!target) return <DataRow label={label}>Not fetched.</DataRow>;

  if (!target.reachable) {
    return (
      <DataRow label={label}>
        <span className="text-muted">{target.error ?? "Nothing listening."}</span>
      </DataRow>
    );
  }

  return (
    <DataRow label={label}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="font-mono text-xs tabular-nums">{target.status_code}</span>
        {target.redirects_to ? (
          <span className="text-xs text-muted">→ {target.redirects_to}</span>
        ) : null}
        {target.elapsed_ms !== null ? (
          <span className="text-xs text-muted tabular-nums">
            {Math.round(target.elapsed_ms)}ms
          </span>
        ) : null}
      </div>
      {target.server ? (
        <div className="mt-0.5 font-mono text-xs text-muted">{target.server}</div>
      ) : null}
    </DataRow>
  );
}
