import { ForbiddenException } from "@nestjs/common";
import { TenantFeatureService } from "./tenant-feature.service";
import type { TenantContext } from "../types/request-context";

const tenant = {
  id: "tenant-1",
  slug: "assuresoft-demo",
  roleKey: "owner",
  permissions: ["tenant.read"],
  features: ["timesheets"]
} satisfies TenantContext;

describe("TenantFeatureService", () => {
  it("returns true when the tenant has the feature", () => {
    const service = new TenantFeatureService();

    expect(service.hasFeature(tenant, "timesheets")).toBe(true);
  });

  it("throws forbidden when the tenant does not have the feature", () => {
    const service = new TenantFeatureService();

    expect(() => service.assertFeatureEnabled(tenant, "documents")).toThrow(ForbiddenException);
  });
});
