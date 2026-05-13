import { combineReducers } from "@reduxjs/toolkit";
import { baseApi } from "@/features/api/base-api";
import { dashboardApi } from "@/features/dashboard/dashboard-api";
import { employeesApi } from "@/features/employees/employees-api";
import { layoutSlice } from "@/features/layout/layout-slice";
import { tenantSlice } from "@/features/tenants/tenant-slice";

export const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  [dashboardApi.reducerPath]: dashboardApi.reducer,
  [employeesApi.reducerPath]: employeesApi.reducer,
  layout: layoutSlice.reducer,
  tenant: tenantSlice.reducer
});
