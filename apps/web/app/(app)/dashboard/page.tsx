"use client";

import { AlertCircle, ClipboardCheck, FileWarning, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/app-shell/page-header";
import { ErrorState } from "@/components/data-display/error-state";
import { MetricCard } from "@/components/data-display/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetDashboardSummaryQuery } from "@/features/dashboard/dashboard-api";
import { employeeFixtures } from "@/test/fixtures/employees";

export default function DashboardPage() {
  const { data, isError, isLoading } = useGetDashboardSummaryQuery();
  const recentEmployees = employeeFixtures.slice(0, 3);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Operational view of people data, approvals, documents, and recruiting activity."
      />

      {isError ? <ErrorState title="Dashboard could not load" /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail={isLoading ? "Loading" : "Currently active"}
          icon={UsersRound}
          label="Active employees"
          value={String(data?.activeEmployees ?? "-")}
        />
        <MetricCard
          detail="Leave and employee changes"
          icon={ClipboardCheck}
          label="Pending approvals"
          value={String(data?.pendingApprovals ?? "-")}
        />
        <MetricCard
          detail="Next 30 days"
          icon={FileWarning}
          label="Expiring documents"
          value={String(data?.expiringDocuments ?? "-")}
        />
        <MetricCard
          detail="Recruiting pipeline"
          icon={AlertCircle}
          label="Open roles"
          value={String(data?.openRoles ?? "-")}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent employee updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {recentEmployees.map((employee) => (
                <div className="flex items-center justify-between gap-4 py-3" key={employee.id}>
                  <div>
                    <p className="font-medium">{employee.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {employee.jobTitle} · {employee.department}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">{employee.location}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Work queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="rounded-md bg-muted p-3">
                <p className="font-medium">Approve 3 leave requests</p>
                <p className="mt-1 text-muted-foreground">Managers are waiting on HR review.</p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="font-medium">Review missing documents</p>
                <p className="mt-1 text-muted-foreground">7 employee files need follow-up.</p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="font-medium">Prepare onboarding packet</p>
                <p className="mt-1 text-muted-foreground">New hire starts next Monday.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
