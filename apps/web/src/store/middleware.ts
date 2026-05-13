import type { Middleware } from "@reduxjs/toolkit";
import { baseApi } from "@/features/api/base-api";
import { dashboardApi } from "@/features/dashboard/dashboard-api";
import { employeesApi } from "@/features/employees/employees-api";

export const middleware = [baseApi.middleware, dashboardApi.middleware, employeesApi.middleware] satisfies Middleware[];
