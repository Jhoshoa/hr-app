import { Body, Controller, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../../../common/decorators/current-user.decorator";
import { PlatformRoles } from "../../../../common/decorators/platform-roles.decorator";
import { SkipTenant } from "../../../../common/decorators/skip-tenant.decorator";
import type { AuthenticatedUserContext } from "../../../../common/types/request-context";
import { ArchivePlatformTenantUseCase } from "../../application/use-cases/archive-platform-tenant.use-case";
import { ReactivatePlatformTenantUseCase } from "../../application/use-cases/reactivate-platform-tenant.use-case";
import { ArchivePlatformTenantDto } from "../dto/platform-tenant.dto";

@ApiBearerAuth()
@ApiTags("platform tenants")
@SkipTenant()
@Controller("platform/tenants")
export class PlatformTenantsController {
  constructor(
    private readonly archivePlatformTenantUseCase: ArchivePlatformTenantUseCase,
    private readonly reactivatePlatformTenantUseCase: ReactivatePlatformTenantUseCase
  ) {}

  @Post(":id/archive")
  @PlatformRoles("PLATFORM_OWNER", "PLATFORM_ADMIN")
  async archive(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() body: ArchivePlatformTenantDto
  ) {
    return this.archivePlatformTenantUseCase.execute({
      tenantId: id,
      actorUserId: user.id,
      reason: body.reason
    });
  }

  @Post(":id/reactivate")
  @PlatformRoles("PLATFORM_OWNER", "PLATFORM_ADMIN")
  async reactivate(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("id", new ParseUUIDPipe()) id: string
  ) {
    return this.reactivatePlatformTenantUseCase.execute({
      tenantId: id,
      actorUserId: user.id
    });
  }
}
