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
    clearTenants: (state) => {
      state.availableTenants = [];
      state.currentTenant = currentTenantFixture;
    },
    selectTenant: (state, action: { payload: string }) => {
      const tenant = state.availableTenants.find((item) => item.tenantSlug === action.payload);

      if (tenant) {
        state.currentTenant = tenant;
      }
    },
    setTenants: (state, action: { payload: TenantSummary[] }) => {
      state.availableTenants = action.payload;
      state.currentTenant = action.payload[0] ?? currentTenantFixture;
    }
  }
});

export const { clearTenants, selectTenant, setTenants } = tenantSlice.actions;
