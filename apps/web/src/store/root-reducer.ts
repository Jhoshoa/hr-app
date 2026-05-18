import { combineReducers } from "@reduxjs/toolkit";
import { baseApi } from "@/features/api/base-api";
import { authSlice } from "@/features/auth/auth-slice";
import { dashboardApi } from "@/features/dashboard/dashboard-api";
import { layoutSlice } from "@/features/layout/layout-slice";
import { tenantSlice } from "@/features/tenants/tenant-slice";

export const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  [dashboardApi.reducerPath]: dashboardApi.reducer,
  auth: authSlice.reducer,
  layout: layoutSlice.reducer,
  tenant: tenantSlice.reducer
});
