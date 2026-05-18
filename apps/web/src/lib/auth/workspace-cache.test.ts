import { afterEach, describe, expect, it } from "vitest";
import {
  clearWorkspaceContextCache,
  loadWorkspaceContextCache,
  saveSelectedTenantSlugToWorkspaceCache,
  saveWorkspaceContextCache
} from "./workspace-cache";

describe("workspace-cache", () => {
  afterEach(() => {
    clearWorkspaceContextCache();
  });

  it("saves and loads workspace context", () => {
    saveWorkspaceContextCache({
      user: {
        id: "user-1",
        email: "hr@example.com",
        name: "HR User"
      },
      tenants: [
        {
          features: [],
          tenantId: "tenant-1",
          tenantSlug: "demo",
          tenantName: "Demo",
          roleKey: "hr_admin",
          permissions: ["tenant.read"]
        }
      ],
      platformRoles: ["PLATFORM_OWNER"],
      selectedTenantSlug: "demo"
    });

    expect(loadWorkspaceContextCache()).toEqual({
      user: {
        id: "user-1",
        email: "hr@example.com",
        name: "HR User"
      },
      tenants: [
        {
          features: [],
          tenantId: "tenant-1",
          tenantSlug: "demo",
          tenantName: "Demo",
          roleKey: "hr_admin",
          permissions: ["tenant.read"]
        }
      ],
      platformRoles: ["PLATFORM_OWNER"],
      selectedTenantSlug: "demo"
    });
  });

  it("clears workspace context", () => {
    saveWorkspaceContextCache({
      user: {
        id: "user-1",
        email: "hr@example.com"
      },
      tenants: [],
      platformRoles: []
    });

    clearWorkspaceContextCache();

    expect(loadWorkspaceContextCache()).toBeNull();
  });

  it("updates the selected tenant in the workspace context cache", () => {
    saveWorkspaceContextCache({
      user: {
        id: "user-1",
        email: "hr@example.com"
      },
      tenants: [
        {
          features: [],
          tenantId: "tenant-1",
          tenantSlug: "demo",
          tenantName: "Demo",
          roleKey: "hr_admin",
          permissions: ["tenant.read"]
        },
        {
          features: [],
          tenantId: "tenant-2",
          tenantSlug: "acme",
          tenantName: "Acme",
          roleKey: "owner",
          permissions: ["tenant.read"]
        }
      ],
      platformRoles: [],
      selectedTenantSlug: "demo"
    });

    saveSelectedTenantSlugToWorkspaceCache("acme");

    expect(loadWorkspaceContextCache()?.selectedTenantSlug).toBe("acme");
  });
});
