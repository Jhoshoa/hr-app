import { baseApi } from "@/features/api/base-api";
import type { EmployeeJobAssignment, EmployeeListFilters, EmployeeListItem } from "@/types/employees";

interface ApiEmployee {
  readonly id: string;
  readonly employeeNumber: string;
  readonly status: EmployeeListItem["status"];
  readonly firstName: string;
  readonly lastName: string;
  readonly workEmail: string;
  readonly startDate: string;
  readonly jobAssignments?: readonly EmployeeJobAssignment[];
}

interface AddEmployeeJobAssignmentRequest {
  readonly employeeId: string;
  readonly payload: {
    readonly departmentId?: string;
    readonly jobTitleId?: string;
    readonly locationId?: string;
    readonly organizationUnitId?: string;
    readonly employmentTypeId?: string;
    readonly workModeId?: string;
    readonly effectiveFrom: string;
    readonly effectiveTo?: string;
  };
}

const buildQueryString = (filters: EmployeeListFilters = {}) => {
  const params = new URLSearchParams();

  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }
  if (filters.departmentId) {
    params.set("departmentId", filters.departmentId);
  }
  if (filters.locationId) {
    params.set("locationId", filters.locationId);
  }
  if (filters.organizationUnitId) {
    params.set("organizationUnitId", filters.organizationUnitId);
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

const toEmployeeListItem = (employee: ApiEmployee): EmployeeListItem => {
  const currentAssignment = employee.jobAssignments?.[0];

  return {
    id: employee.id,
    employeeNumber: employee.employeeNumber,
    name: `${employee.firstName} ${employee.lastName}`.trim(),
    workEmail: employee.workEmail,
    departmentId: currentAssignment?.departmentId ?? null,
    department: "Not assigned",
    jobTitleId: currentAssignment?.jobTitleId ?? null,
    jobTitle: "Not assigned",
    locationId: currentAssignment?.locationId ?? null,
    location: "Not assigned",
    organizationUnitId: currentAssignment?.organizationUnitId ?? null,
    organizationUnit: "Not assigned",
    manager: "Not assigned",
    status: employee.status,
    startDate: employee.startDate,
    jobAssignments: employee.jobAssignments ?? []
  };
};

export const employeesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listEmployees: builder.query<EmployeeListItem[], EmployeeListFilters | void>({
      query: (filters) => `employees${buildQueryString(filters ?? {})}`,
      transformResponse: (employees: ApiEmployee[]) => employees.map(toEmployeeListItem),
      providesTags: ["Employee"]
    }),
    addEmployeeJobAssignment: builder.mutation<EmployeeJobAssignment, AddEmployeeJobAssignmentRequest>({
      query: ({ employeeId, payload }) => ({
        url: `employees/${employeeId}/job-assignments`,
        method: "POST",
        body: payload
      }),
      invalidatesTags: ["Employee", "AuditEvent"]
    })
  })
});

export const { useAddEmployeeJobAssignmentMutation, useListEmployeesQuery } = employeesApi;
