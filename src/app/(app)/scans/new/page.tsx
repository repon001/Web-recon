import type { Metadata } from "next";

import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

import { NewScanForm } from "./new-scan-form";

export const metadata: Metadata = { title: "New scan" };

export default function NewScanPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">New scan</h1>
        <p className="mt-0.5 text-sm text-muted">
          The scan starts immediately and streams its progress on the report page.
        </p>
      </div>

      {/*
        Not a disclaimer to be scrolled past. This makes real requests to real
        servers, and doing that to infrastructure you neither own nor have
        written permission to test is unauthorised access in most jurisdictions.
      */}
      <Alert tone="warning" title="Only scan what you are allowed to scan">
        Your own domains, a lab you built, something inside a bug bounty programme&rsquo;s
        stated scope, or a client who has signed a statement of work. The difference
        between a scanner and an attack is authorisation, and nothing else.
      </Alert>

      <Card>
        <CardHeader
          title="Target"
          description="One domain per scan. The backend refuses IP literals and reserved suffixes."
        />
        <CardBody>
          <NewScanForm />
        </CardBody>
      </Card>
    </div>
  );
}
