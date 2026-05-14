import { describe, expect, it } from "vitest";
import type { MeResponse } from "@/features/auth/current-user-api";
import { canAccessRoute, resolveInitialRoute } from "./route-resolution";

const baseMe: MeResponse = {
  platformRoles: [],
  tenants: [],
  user: {
    email: "user@example.test",
    id: "user-1"
  }
};

const tenantMe: MeResponse = {
  ...baseMe,
  tenants: [
    {
      permissions: ["tenant.read"],
      roleKey: "owner",
      tenantId: "tenant-1",
      tenantName: "AssureSoft Demo",
      tenantSlug: "assuresoft-demo"
    }
  ]
};

const platformMe: MeResponse = {
  ...baseMe,
  platformRoles: ["PLATFORM_OWNER"]
};

describe("route-resolution", () => {
  it("routes platform-only users to the platform home", () => {
    expect(resolveInitialRoute(platformMe)).toBe("/platform/company-signups");
  });

  it("routes tenant users to the tenant dashboard", () => {
    expect(resolveInitialRoute(tenantMe)).toBe("/dashboard");
  });

  it("routes users without access to no-access", () => {
    expect(resolveInitialRoute(baseMe)).toBe("/no-access");
  });

  it("honors tenant redirectTo only for users with tenant access", () => {
    expect(resolveInitialRoute(tenantMe, "/settings/company")).toBe("/settings/company");
    expect(resolveInitialRoute(platformMe, "/settings/company")).toBe("/platform/company-signups");
  });

  it("honors platform redirectTo only for users with platform access", () => {
    expect(resolveInitialRoute(platformMe, "/platform/company-signups")).toBe("/platform/company-signups");
    expect(resolveInitialRoute(tenantMe, "/platform/company-signups")).toBe("/dashboard");
  });

  it("rejects external redirect targets", () => {
    expect(resolveInitialRoute(tenantMe, "https://example.com/settings")).toBe("/dashboard");
    expect(resolveInitialRoute(tenantMe, "//example.com/settings")).toBe("/dashboard");
  });

  it("classifies route access by broad area", () => {
    expect(canAccessRoute(platformMe, "/platform/company-signups")).toBe(true);
    expect(canAccessRoute(platformMe, "/dashboard")).toBe(false);
    expect(canAccessRoute(tenantMe, "/dashboard")).toBe(true);
    expect(canAccessRoute(tenantMe, "/platform/company-signups")).toBe(false);
  });
});
