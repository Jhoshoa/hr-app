import "reflect-metadata";
import { IS_PUBLIC_KEY } from "../../../../common/decorators/public.decorator";
import { SKIP_TENANT_KEY } from "../../../../common/decorators/skip-tenant.decorator";
import { CompanySignupRequestsController } from "../../presentation/controllers/company-signup-requests.controller";

describe("CompanySignupRequestsController", () => {
  it("is public at controller level", () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, CompanySignupRequestsController)).toBe(true);
  });

  it("skips tenant context at controller level", () => {
    expect(Reflect.getMetadata(SKIP_TENANT_KEY, CompanySignupRequestsController)).toBe(true);
  });

  it("keeps availability and submit endpoints under the public controller", () => {
    expect(typeof CompanySignupRequestsController.prototype.create).toBe("function");
    expect(typeof CompanySignupRequestsController.prototype.checkTenantSlug).toBe("function");
    expect(typeof CompanySignupRequestsController.prototype.checkAdminEmail).toBe("function");
    expect(typeof CompanySignupRequestsController.prototype.checkCompanyWebsite).toBe("function");
  });
});
