import Link from "next/link";
import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/app-shell/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage tenant configuration, access, and operational defaults."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Link href="/settings/organization">
          <Card className="h-full transition-colors hover:border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4" aria-hidden="true" />
                Organization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Departments, locations, job titles, employment types, work modes, and client projects.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </>
  );
}
