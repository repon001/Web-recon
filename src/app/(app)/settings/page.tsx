import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DataRow } from "@/components/ui/table";
import { requireUser } from "@/lib/auth/require-user";
import { formatDateTime } from "@/lib/ui/format";

import { PasswordForm, ProfileForm } from "./settings-forms";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  // The layout already fetched this, but a Server Component cannot read its
  // parent's data. The second call is cheap and keeps the page independent of
  // whatever the layout happens to do today.
  const user = await requireUser();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-0.5 text-sm text-muted">Your account on this scanner.</p>
      </div>

      <Card>
        <CardHeader title="Profile" description="Shown in the header, and used to sign in." />
        <CardBody>
          <ProfileForm user={user} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Password"
          description="Changing this does not sign out your other sessions — the backend does not revoke tokens."
        />
        <CardBody>
          <PasswordForm />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Account" description="Read-only, set by the backend." />
        <CardBody>
          <dl className="divide-y divide-border">
            <DataRow label="User id">
              <code className="font-mono text-xs">{user.id}</code>
            </DataRow>
            <DataRow label="Role">
              {user.is_superuser ? (
                <Badge className="border-primary/30 bg-primary/10 text-primary">
                  Superuser
                </Badge>
              ) : (
                <Badge>Standard</Badge>
              )}
            </DataRow>
            <DataRow label="Status">
              {user.is_active ? (
                <span className="text-success">Active</span>
              ) : (
                <span className="text-danger">Inactive</span>
              )}
            </DataRow>
            <DataRow label="Created">{formatDateTime(user.created_at)}</DataRow>
            <DataRow label="Last updated">{formatDateTime(user.updated_at)}</DataRow>
          </dl>
        </CardBody>
      </Card>
    </div>
  );
}
