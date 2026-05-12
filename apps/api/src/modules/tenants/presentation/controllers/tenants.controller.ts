import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentTenant } from "../../../../common/decorators/current-tenant.decorator";
import { Permissions } from "../../../../common/decorators/permissions.decorator";
import type { TenantContext } from "../../../../common/types/request-context";
import { GetCurrentTenantUseCase } from "../../application/use-cases/get-current-tenant.use-case";

@ApiBearerAuth()
@ApiTags("tenants")
@Controller("tenants")
export class TenantsController {
  constructor(private readonly getCurrentTenantUseCase: GetCurrentTenantUseCase) {}

  @Get("current")
  @Permissions("tenant.read")
  async getCurrentTenant(@CurrentTenant() tenantContext: TenantContext) {
    return this.getCurrentTenantUseCase.execute(tenantContext.id);
  }
}
