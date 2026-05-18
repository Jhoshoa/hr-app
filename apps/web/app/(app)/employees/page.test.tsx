import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import EmployeesPage from "./page";

const listEmployees = vi.fn();
const addAssignment = vi.fn();

vi.mock("@/hooks/use-current-tenant", () => ({
  useCurrentTenant: () => ({
    tenantSlug: "assuresoft-demo"
  })
}));

vi.mock("@/features/employees/employees-api", () => ({
  useAddEmployeeJobAssignmentMutation: () => [addAssignment, { isLoading: false }],
  useListEmployeesQuery: (filters: unknown) => listEmployees(filters)
}));

vi.mock("@/features/organization/organization-api", () => ({
  useListOrganizationRecordsQuery: ({ kind }: { kind: string }) => {
    const recordsByKind = {
      department: [{ id: "department-1", name: "People", status: "ACTIVE" }],
      jobTitle: [{ id: "job-title-1", name: "HR Manager", status: "ACTIVE" }],
      location: [{ id: "location-1", name: "New York HQ", status: "ACTIVE" }],
      employmentType: [{ id: "employment-type-1", name: "Full time", status: "ACTIVE" }],
      workMode: [{ id: "work-mode-1", name: "Hybrid", status: "ACTIVE" }]
    } as const;

    return { data: recordsByKind[kind as keyof typeof recordsByKind] ?? [], isError: false };
  }
}));

vi.mock("@/features/organization/organization-units-api", () => ({
  useListOrganizationUnitsQuery: () => ({
    data: [{ id: "unit-1", name: "Operations East", status: "ACTIVE" }],
    isError: false
  })
}));

describe("EmployeesPage", () => {
  it("filters employees by organization unit and shows assignment controls", () => {
    listEmployees.mockReturnValue({
      data: [
        {
          id: "employee-1",
          employeeNumber: "A-001",
          name: "Alex Adams",
          workEmail: "alex@example.com",
          departmentId: "department-1",
          department: "Not assigned",
          jobTitleId: "job-title-1",
          jobTitle: "Not assigned",
          locationId: "location-1",
          location: "Not assigned",
          organizationUnitId: "unit-1",
          organizationUnit: "Not assigned",
          manager: "Not assigned",
          status: "ACTIVE",
          startDate: "2026-01-01T00:00:00.000Z",
          jobAssignments: []
        }
      ],
      isError: false,
      isLoading: false
    });

    render(
      <ToastProvider>
        <EmployeesPage />
      </ToastProvider>
    );

    fireEvent.change(screen.getByLabelText("Filter by organization unit"), {
      target: { value: "unit-1" }
    });

    expect(listEmployees).toHaveBeenLastCalledWith({
      search: "",
      organizationUnitId: "unit-1"
    });
    expect(screen.getAllByText("Operations East").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Add job assignment for Alex Adams")).toBeInTheDocument();
  });
});
