import "reflect-metadata";
import { REQUIRED_PLATFORM_ROLES_KEY } from "../../../../common/decorators/platform-roles.decorator";
import { SKIP_TENANT_KEY } from "../../../../common/decorators/skip-tenant.decorator";
import { PlatformCompanySignupRequestsController } from "../../presentation/controllers/platform-company-signup-requests.controller";

describe("PlatformCompanySignupRequestsController", () => {
  it("skips tenant context at controller level", () => {
    expect(Reflect.getMetadata(SKIP_TENANT_KEY, PlatformCompanySignupRequestsController)).toBe(true);
  });

  it("allows support role to list and view signup requests", () => {
    expect(rolesFor("list")).toEqual(["PLATFORM_OWNER", "PLATFORM_ADMIN", "PLATFORM_SUPPORT"]);
    expect(rolesFor("get")).toEqual(["PLATFORM_OWNER", "PLATFORM_ADMIN", "PLATFORM_SUPPORT"]);
  });

  it("restricts approve and reject to owner/admin platform roles", () => {
    expect(rolesFor("approve")).toEqual(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);
    expect(rolesFor("reject")).toEqual(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);
  });
});

const rolesFor = (
  method: keyof Pick<
    PlatformCompanySignupRequestsController,
    "list" | "get" | "approve" | "reject"
  >
) =>
  Reflect.getMetadata(
    REQUIRED_PLATFORM_ROLES_KEY,
    PlatformCompanySignupRequestsController.prototype[method]
  );
