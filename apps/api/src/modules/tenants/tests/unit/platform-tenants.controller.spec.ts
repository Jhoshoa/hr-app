import "reflect-metadata";
import { REQUIRED_PLATFORM_ROLES_KEY } from "../../../../common/decorators/platform-roles.decorator";
import { SKIP_TENANT_KEY } from "../../../../common/decorators/skip-tenant.decorator";
import { PlatformTenantsController } from "../../presentation/controllers/platform-tenants.controller";

describe("PlatformTenantsController", () => {
  it("skips tenant context at controller level", () => {
    expect(Reflect.getMetadata(SKIP_TENANT_KEY, PlatformTenantsController)).toBe(true);
  });

  it("restricts tenant status changes to owner/admin platform roles", () => {
    expect(rolesFor("archive")).toEqual(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);
    expect(rolesFor("reactivate")).toEqual(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);
  });
});

const rolesFor = (method: keyof Pick<PlatformTenantsController, "archive" | "reactivate">) =>
  Reflect.getMetadata(REQUIRED_PLATFORM_ROLES_KEY, PlatformTenantsController.prototype[method]);
