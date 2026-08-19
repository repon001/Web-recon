import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableScroll, Td, Th } from "@/components/ui/table";
import type { CookieCheck, HeaderCheck } from "@/lib/api/types";
import { cn } from "@/lib/ui/cn";

/**
 * Every security header, graded.
 *
 * Present-but-wrong is a distinct state from absent and is shown as one:
 * a Referrer-Policy of `no-referrer-when-downgrade` is set, and still leaks
 * the full URL. Collapsing those two into a tick and a cross loses the
 * distinction that decides what the fix is.
 */
export function HeadersSection({
  headerChecks,
  cookies,
}: {
  headerChecks: HeaderCheck[];
  cookies: CookieCheck[];
}) {
  return (
    <div className="flex flex-col gap-5">
      <Card className="overflow-hidden">
        <CardHeader
          title={<h2 className="text-sm font-semibold">Security headers</h2>}
          description="Graded on one response, after following a single redirect hop."
        />
        {headerChecks.length === 0 ? (
          <EmptyState title="No headers checked" description="The site was not reachable over HTTPS." />
        ) : (
          <TableScroll>
            <Table>
              <thead>
                <tr>
                  <Th>Header</Th>
                  <Th>State</Th>
                  <Th className="w-full">Value</Th>
                </tr>
              </thead>
              <tbody>
                {headerChecks.map((check) => (
                  <tr key={check.header}>
                    <Td className="font-mono text-xs whitespace-nowrap">{check.header}</Td>
                    <Td>
                      <HeaderState check={check} />
                    </Td>
                    <Td>
                      {check.value ? (
                        <code className="font-mono text-xs break-anywhere">{check.value}</code>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                      {check.note ? (
                        <p className="mt-0.5 text-xs text-muted">{check.note}</p>
                      ) : null}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableScroll>
        )}
      </Card>

      <Card className="overflow-hidden">
        <CardHeader
          title={<h2 className="text-sm font-semibold">Cookies</h2>}
          description="Flags on every cookie the site set on the scanned response."
        />
        {cookies.length === 0 ? (
          <EmptyState
            title="No cookies set"
            description="Nothing to get the flags wrong on."
          />
        ) : (
          <TableScroll>
            <Table>
              <thead>
                <tr>
                  <Th className="w-full">Name</Th>
                  <Th>Secure</Th>
                  <Th>HttpOnly</Th>
                  <Th>SameSite</Th>
                </tr>
              </thead>
              <tbody>
                {cookies.map((cookie) => (
                  <tr key={cookie.name}>
                    <Td className="font-mono text-xs">{cookie.name}</Td>
                    <Td>
                      <Flag on={cookie.secure} />
                    </Td>
                    <Td>
                      <Flag on={cookie.http_only} />
                    </Td>
                    <Td>
                      {cookie.same_site ? (
                        <span className="font-mono text-xs">{cookie.same_site}</span>
                      ) : (
                        <span className="text-xs text-warning">unset</span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableScroll>
        )}
      </Card>
    </div>
  );
}

function HeaderState({ check }: { check: HeaderCheck }) {
  const label = !check.present ? "Missing" : check.ok ? "OK" : "Weak";
  const tone = !check.present
    ? "border-border bg-surface-muted text-muted"
    : check.ok
      ? "border-success/30 bg-success/10 text-success"
      : "border-medium/30 bg-medium/10 text-medium";

  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap",
        tone,
      )}
    >
      {label}
    </span>
  );
}

/**
 * A tick or a cross, plus the word.
 *
 * The word is not redundant: colour and glyph alone leave a red-green
 * colour-blind reader comparing two similar shapes in two similar greys.
 */
function Flag({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap",
        on ? "text-success" : "text-danger",
      )}
    >
      <span aria-hidden="true">{on ? "✓" : "✗"}</span>
      {on ? "set" : "unset"}
    </span>
  );
}
