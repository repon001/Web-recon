import { Card, CardBody } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown while the report is fetched.
 *
 * Shaped like the real page rather than a spinner, so nothing jumps when the
 * data lands — the boxes are already the size their content will be.
 */
export default function ScanLoading() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <span className="sr-only" role="status">
        Loading the report.
      </span>

      <Skeleton className="h-4 w-24" />

      <Card>
        <CardBody className="flex gap-4">
          <Skeleton className="size-16 shrink-0 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-6 w-52" />
            <Skeleton className="mt-2.5 h-4 w-36" />
            <Skeleton className="mt-2 h-3 w-64" />
          </div>
        </CardBody>
      </Card>

      {Array.from({ length: 2 }, (_, index) => (
        <Card key={index}>
          <CardBody className="flex flex-col gap-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-2/3" />
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
