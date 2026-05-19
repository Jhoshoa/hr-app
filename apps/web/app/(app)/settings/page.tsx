"use client";

import Link from "next/link";
import { Settings2, ShieldCheck, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/app-shell/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentTenant } from "@/hooks/use-current-tenant";
import { accessPermissions, hasAnyAccessPermission } from "@/features/access/access-permissions";

export default function SettingsPage() {
  const tenant = useCurrentTenant();
  const canViewAccess = hasAnyAccessPermission(tenant.permissions, accessPermissions.viewAccess);

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage tenant configuration, access, and operational defaults."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Link href="/settings/company">
          <Card className="h-full transition-colors hover:border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" aria-hidden="true" />
                Company
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Company profile, locations, hierarchy, language, currency, and timezone defaults.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/settings/hr">
          <Card className="h-full transition-colors hover:border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersRound className="h-4 w-4" aria-hidden="true" />
                HR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Departments, job titles, employment types, work modes, and client projects.
              </p>
            </CardContent>
          </Card>
        </Link>

        {canViewAccess ? (
          <Link href="/settings/access">
            <Card className="h-full transition-colors hover:border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Users, roles, permissions, and tenant invitations.
                </p>
              </CardContent>
            </Card>
          </Link>
        ) : null}
      </div>
    </>
  );
}
