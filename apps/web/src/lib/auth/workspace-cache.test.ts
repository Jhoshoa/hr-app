import { afterEach, describe, expect, it } from "vitest";
import {
  clearWorkspaceContextCache,
  loadWorkspaceContextCache,
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
          tenantId: "tenant-1",
          tenantSlug: "demo",
          tenantName: "Demo",
          roleKey: "hr_admin",
          permissions: ["tenant.read"]
        }
      ]
    });

    expect(loadWorkspaceContextCache()).toEqual({
      user: {
        id: "user-1",
        email: "hr@example.com",
        name: "HR User"
      },
      tenants: [
        {
          tenantId: "tenant-1",
          tenantSlug: "demo",
          tenantName: "Demo",
          roleKey: "hr_admin",
          permissions: ["tenant.read"]
        }
      ]
    });
  });

  it("clears workspace context", () => {
    saveWorkspaceContextCache({
      user: {
        id: "user-1",
        email: "hr@example.com"
      },
      tenants: []
    });

    clearWorkspaceContextCache();

    expect(loadWorkspaceContextCache()).toBeNull();
  });
});
