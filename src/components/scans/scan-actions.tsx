"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { messageFor } from "@/lib/api/errors";
import { isActiveStatus, type ScanProfile, type ScanStatus } from "@/lib/api/types";
import { cancelScanAction, deleteScanAction, rescanAction } from "@/lib/scans/actions";

/**
 * Cancel, delete and re-run.
 *
 * `useTransition` rather than local loading state: it keeps the button disabled
 * for the whole round trip *including* the re-render that follows the
 * revalidate, so the row cannot be clicked twice while the new data is still on
 * its way.
 */
export function ScanActions({
  scanId,
  domain,
  profile,
  status,
}: {
  scanId: string;
  domain: string;
  profile: ScanProfile;
  status: ScanStatus;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = isActiveStatus(status);

  const run = (work: () => Promise<unknown>) => {
    setError(null);
    startTransition(async () => {
      try {
        await work();
      } catch (cause) {
        // `redirect()` throws to unwind, and rethrowing lets Next handle it —
        // swallowing it here would show an error on a navigation that worked.
        if (isRedirectError(cause)) throw cause;
        setError(messageFor(cause));
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {active ? (
          <Button
            variant="secondary"
            size="sm"
            loading={pending}
            onClick={() => run(() => cancelScanAction(scanId))}
          >
            Cancel scan
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            loading={pending}
            onClick={() => run(() => rescanAction(domain, profile))}
          >
            Scan again
          </Button>
        )}

        {confirmingDelete ? (
          <>
            <span className="text-xs text-muted">Delete this report?</span>
            <Button
              variant="danger"
              size="sm"
              loading={pending}
              onClick={() => run(() => deleteScanAction(scanId))}
            >
              Delete
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>
              Keep
            </Button>
          </>
        ) : (
          <Button variant="danger" size="sm" onClick={() => setConfirmingDelete(true)}>
            Delete
          </Button>
        )}
      </div>

      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Next signals a redirect by throwing a tagged error.
 *
 * Checked by digest rather than by instanceof, because the class is internal
 * and not exported — the digest string is the documented contract.
 */
function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}
