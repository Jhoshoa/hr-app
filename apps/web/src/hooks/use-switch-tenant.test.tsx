import { configureStore } from "@reduxjs/toolkit";
import { act, renderHook } from "@testing-library/react";
import React, { type ReactNode } from "react";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it } from "vitest";
import { clearWorkspaceContextCache, loadWorkspaceContextCache, saveWorkspaceContextCache } from "@/lib/auth/workspace-cache";
import { middleware } from "@/store/middleware";
import { rootReducer } from "@/store/root-reducer";
import { setTenants } from "@/features/tenants/tenant-slice";
import { useSwitchTenant } from "./use-switch-tenant";

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

const createTestStore = () =>
  configureStore({
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(middleware),
    reducer: rootReducer
  });

describe("useSwitchTenant", () => {
  afterEach(() => {
    clearWorkspaceContextCache();
  });

  it("switches the selected tenant and persists the selected slug", () => {
    const store = createTestStore();
    store.dispatch(setTenants([acmeTenant, globexTenant]));
    saveWorkspaceContextCache({
      user: {
        email: "owner@example.com",
        id: "user-1"
      },
      tenants: [acmeTenant, globexTenant],
      platformRoles: [],
      selectedTenantSlug: "acme"
    });

    const wrapper = ({ children }: Readonly<{ children: ReactNode }>) => (
      <Provider store={store}>{children}</Provider>
    );
    const { result } = renderHook(() => useSwitchTenant(), { wrapper });

    act(() => {
      expect(result.current("globex")).toBe(true);
    });

    expect(store.getState().tenant.currentTenant.tenantSlug).toBe("globex");
    expect(loadWorkspaceContextCache()?.selectedTenantSlug).toBe("globex");
  });

  it("does not switch to an unavailable tenant", () => {
    const store = createTestStore();
    store.dispatch(setTenants([acmeTenant]));
    const wrapper = ({ children }: Readonly<{ children: ReactNode }>) => (
      <Provider store={store}>{children}</Provider>
    );
    const { result } = renderHook(() => useSwitchTenant(), { wrapper });

    act(() => {
      expect(result.current("missing")).toBe(false);
    });

    expect(store.getState().tenant.currentTenant.tenantSlug).toBe("acme");
  });
});
