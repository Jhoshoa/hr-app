import { createSlice } from "@reduxjs/toolkit";
import { currentTenantFixture } from "@/test/fixtures/current-user";
import type { TenantSummary } from "@/types/identity";

interface TenantState {
  readonly currentTenant: TenantSummary;
  readonly availableTenants: TenantSummary[];
}

const initialState: TenantState = {
  availableTenants: [currentTenantFixture],
  currentTenant: currentTenantFixture
};

export const tenantSlice = createSlice({
  initialState,
  name: "tenant",
  reducers: {
    setTenants: (state, action: { payload: TenantSummary[] }) => {
      state.availableTenants = action.payload;
      state.currentTenant = action.payload[0] ?? currentTenantFixture;
    }
  }
});

export const { setTenants } = tenantSlice.actions;
