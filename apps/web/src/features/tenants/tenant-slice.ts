import { createSlice } from "@reduxjs/toolkit";
import { currentTenantFixture } from "@/test/fixtures/current-user";
import type { TenantSummary } from "@/types/identity";

interface TenantState {
  readonly currentTenant: TenantSummary;
  readonly availableTenants: readonly TenantSummary[];
}

const initialState: TenantState = {
  availableTenants: [currentTenantFixture],
  currentTenant: currentTenantFixture
};

export const tenantSlice = createSlice({
  initialState,
  name: "tenant",
  reducers: {}
});
