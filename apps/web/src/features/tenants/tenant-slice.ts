import { createSlice } from "@reduxjs/toolkit";
import { currentTenantFixture } from "@/test/fixtures/current-user";
import type { TenantSummary } from "@/types/identity";

interface TenantState {
  readonly currentTenant: TenantSummary;
  readonly availableTenants: TenantSummary[];
  readonly isHydrated: boolean;
}

const initialState: TenantState = {
  availableTenants: [currentTenantFixture],
  currentTenant: currentTenantFixture,
  isHydrated: false
};

export const tenantSlice = createSlice({
  initialState,
  name: "tenant",
  reducers: {
    clearTenants: (state) => {
      state.availableTenants = [];
      state.currentTenant = currentTenantFixture;
      state.isHydrated = false;
    },
    selectTenant: (state, action: { payload: string }) => {
      const tenant = state.availableTenants.find((item) => item.tenantSlug === action.payload);

      if (tenant) {
        state.currentTenant = tenant;
        state.isHydrated = true;
      }
    },
    setTenants: (state, action: { payload: TenantSummary[] }) => {
      state.availableTenants = action.payload;
      state.currentTenant =
        action.payload.find((tenant) => tenant.tenantSlug === state.currentTenant.tenantSlug) ??
        action.payload[0] ??
        currentTenantFixture;
      state.isHydrated = action.payload.length > 0;
    },
    updateCurrentTenantName: (state, action: { payload: string }) => {
      state.currentTenant.tenantName = action.payload;
      state.availableTenants = state.availableTenants.map((tenant) =>
        tenant.tenantId === state.currentTenant.tenantId ? { ...tenant, tenantName: action.payload } : tenant
      );
    }
  }
});

export const { clearTenants, selectTenant, setTenants, updateCurrentTenantName } = tenantSlice.actions;
