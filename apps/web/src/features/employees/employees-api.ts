import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { employeeFixtures } from "@/test/fixtures/employees";
import type { EmployeeListItem } from "@/types/employees";

export const employeesApi = createApi({
  baseQuery: fakeBaseQuery(),
  reducerPath: "employeesApi",
  tagTypes: ["Employee"],
  endpoints: (builder) => ({
    listEmployees: builder.query<EmployeeListItem[], void>({
      providesTags: ["Employee"],
      queryFn: () => ({ data: employeeFixtures })
    })
  })
});

export const { useListEmployeesQuery } = employeesApi;
