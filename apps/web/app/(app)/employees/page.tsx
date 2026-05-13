"use client";

import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell/page-header";
import { EmptyState } from "@/components/data-display/empty-state";
import { ErrorState } from "@/components/data-display/error-state";
import { EmployeeStatusBadge } from "@/components/data-display/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useListEmployeesQuery } from "@/features/employees/employees-api";
import { formatShortDate } from "@/lib/format/date";

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const { data = [], isError, isLoading } = useListEmployeesQuery();

  const employees = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return data;
    }

    return data.filter((employee) =>
      [employee.name, employee.workEmail, employee.department, employee.jobTitle, employee.location]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [data, search]);

  return (
    <>
      <PageHeader
        actions={
          <Button>
            <Plus size={16} aria-hidden="true" />
            New employee
          </Button>
        }
        title="Employees"
        description="Core employee database with status, job, department, location, and manager context."
      />

      <Card className="mb-4 p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            className="pl-9"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search employees"
            value={search}
          />
        </div>
      </Card>

      {isError ? <ErrorState title="Employees could not load" /> : null}

      {!isError && employees.length === 0 && !isLoading ? (
        <EmptyState
          title="No employees found"
          description="Adjust the search or add a new employee when the create flow is available."
        />
      ) : null}

      {employees.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-border bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Employee</th>
                  <th className="px-4 py-3 font-semibold">Job</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Manager</th>
                  <th className="px-4 py-3 font-semibold">Start date</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {employees.map((employee) => (
                  <tr className="bg-surface hover:bg-muted/50" key={employee.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{employee.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {employee.employeeNumber} · {employee.workEmail}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{employee.jobTitle}</p>
                      <p className="text-xs text-muted-foreground">{employee.department}</p>
                    </td>
                    <td className="px-4 py-3">{employee.location}</td>
                    <td className="px-4 py-3">{employee.manager}</td>
                    <td className="px-4 py-3">{formatShortDate(employee.startDate)}</td>
                    <td className="px-4 py-3">
                      <EmployeeStatusBadge status={employee.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </>
  );
}
