import type { Middleware } from "@reduxjs/toolkit";
import { baseApi } from "@/features/api/base-api";
import { dashboardApi } from "@/features/dashboard/dashboard-api";

export const middleware = [baseApi.middleware, dashboardApi.middleware] satisfies Middleware[];
