import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { employeeFixtures } from "@/test/fixtures/employees";

export interface DashboardSummary {
  readonly activeEmployees: number;
  readonly pendingApprovals: number;
  readonly expiringDocuments: number;
  readonly openRoles: number;
}

export const dashboardApi = createApi({
  baseQuery: fakeBaseQuery(),
  reducerPath: "dashboardApi",
  endpoints: (builder) => ({
    getDashboardSummary: builder.query<DashboardSummary, void>({
      queryFn: () => ({
        data: {
          activeEmployees: employeeFixtures.filter((employee) => employee.status === "ACTIVE").length,
          expiringDocuments: 7,
          openRoles: 4,
          pendingApprovals: 5
        }
      })
    })
  })
});

export const { useGetDashboardSummaryQuery } = dashboardApi;
