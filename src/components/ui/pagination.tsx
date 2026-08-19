import { ButtonLink } from "@/components/ui/button";
import type { Page } from "@/lib/api/types";

/**
 * Offset paging, as links.
 *
 * Links rather than buttons because the page number belongs in the URL: it
 * makes the second page shareable, survives a refresh, and lets the browser
 * back button do the obvious thing. A pair of onClick handlers would give up
 * all three.
 */
export function Pagination({
  page,
  basePath,
  label = "results",
}: {
  page: Pick<Page<unknown>, "total" | "limit" | "offset"> & { items: unknown[] };
  basePath: string;
  label?: string;
}) {
  const { total, limit, offset, items } = page;
  if (total <= limit) return null;

  const first = offset + 1;
  const last = offset + items.length;
  const hasPrevious = offset > 0;
  const hasNext = last < total;

  const href = (nextOffset: number) =>
    nextOffset <= 0 ? basePath : `${basePath}?offset=${nextOffset}`;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3 border-t border-border px-5 py-3"
    >
      <p className="text-xs text-muted tabular-nums">
        {first}–{last} of {total} {label}
      </p>
      <div className="flex items-center gap-2">
        <ButtonLink
          variant="secondary"
          size="sm"
          href={href(Math.max(0, offset - limit))}
          aria-disabled={!hasPrevious || undefined}
          // A disabled link is still focusable and still navigable by keyboard
          // unless it is taken out of the tab order too.
          tabIndex={hasPrevious ? undefined : -1}
        >
          Previous
        </ButtonLink>
        <ButtonLink
          variant="secondary"
          size="sm"
          href={href(offset + limit)}
          aria-disabled={!hasNext || undefined}
          tabIndex={hasNext ? undefined : -1}
        >
          Next
        </ButtonLink>
      </div>
    </nav>
  );
}
