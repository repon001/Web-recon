import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown while the list is fetched.
 *
 * Shaped like the real rows rather than a spinner, so the page does not jump
 * when the data lands — the layout is already the right size.
 */
export default function ScansLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <span className="sr-only" role="status">
        Loading scans.
      </span>

      <div className="flex items-center justify-between gap-3">
        <div>
          <Skeleton className="h-6 w-28" />
          <Skeleton className="mt-2 h-4 w-44" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>

      <Card className="overflow-hidden">
        <CardHeader title={<Skeleton className="h-4 w-20" />} />
        <ul>
          {Array.from({ length: 4 }, (_, index) => (
            <li key={index} className="flex gap-4 border-b border-border px-5 py-4 last:border-b-0">
              <Skeleton className="size-11 shrink-0 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="mt-2.5 h-3 w-64" />
              </div>
              <Skeleton className="hidden h-3 w-24 sm:block" />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
