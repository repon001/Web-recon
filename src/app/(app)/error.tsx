"use client";

import { useEffect } from "react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

/**
 * The error boundary for every signed-in page.
 *
 * Must be a Client Component — React needs a class boundary underneath, and
 * `reset()` re-renders the segment on the client. It receives the *digest* of
 * the server-side error, not its message: Next deliberately strips the message
 * in production so a stack trace or a connection string cannot reach a browser.
 * The digest is what correlates this screen with the server log.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Where a Sentry/OpenTelemetry call would go. Logging to the console at
    // least means the detail is somewhere a developer can find it locally.
    console.error("Unhandled error in the app segment:", error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 py-10">
      <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="text-sm text-muted">
        The page could not be rendered. If the backend was restarting, trying again is
        usually enough.
      </p>

      <Card>
        <CardBody className="flex flex-col gap-4">
          <p className="text-sm break-anywhere text-muted">{error.message}</p>
          {error.digest ? (
            <p className="font-mono text-xs text-muted">
              digest {error.digest}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button onClick={reset}>Try again</Button>
            <ButtonLink href="/scans" variant="secondary">
              Back to scans
            </ButtonLink>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
