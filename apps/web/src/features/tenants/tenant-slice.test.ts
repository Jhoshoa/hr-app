import { describe, expect, it } from "vitest";
import { currentTenantFixture } from "@/test/fixtures/current-user";
import { selectTenant, setTenants, tenantSlice } from "./tenant-slice";

const acmeTenant = {
  features: [],
  tenantId: "tenant-acme",
  tenantName: "Acme",
  tenantSlug: "acme",
  roleKey: "owner",
  permissions: ["tenant.read", "tenant.manage"]
};

const globexTenant = {
  features: [],
  tenantId: "tenant-globex",
  tenantName: "Globex",
  tenantSlug: "globex",
  roleKey: "hr_admin",
  permissions: ["tenant.read"]
};

describe("tenantSlice", () => {
  it("preserves the selected tenant when refreshed tenant access still contains it", () => {
    const withTenants = tenantSlice.reducer(undefined, setTenants([acmeTenant, globexTenant]));
    const withSelection = tenantSlice.reducer(withTenants, selectTenant("globex"));
    const refreshed = tenantSlice.reducer(withSelection, setTenants([acmeTenant, globexTenant]));

    expect(refreshed.currentTenant).toEqual(globexTenant);
    expect(refreshed.availableTenants).toEqual([acmeTenant, globexTenant]);
    expect(refreshed.isHydrated).toBe(true);
  });

  it("falls back to the first available tenant when the selected tenant disappears", () => {
    const withTenants = tenantSlice.reducer(undefined, setTenants([acmeTenant, globexTenant]));
    const withSelection = tenantSlice.reducer(withTenants, selectTenant("globex"));
    const refreshed = tenantSlice.reducer(withSelection, setTenants([acmeTenant]));

    expect(refreshed.currentTenant).toEqual(acmeTenant);
    expect(refreshed.isHydrated).toBe(true);
  });

  it("clears hydration when there are no available tenants", () => {
    const state = tenantSlice.reducer(undefined, setTenants([]));

    expect(state.currentTenant).toEqual(currentTenantFixture);
    expect(state.availableTenants).toEqual([]);
    expect(state.isHydrated).toBe(false);
  });
});
