import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentTenant } from "../../../../common/decorators/current-tenant.decorator";
import { Permissions } from "../../../../common/decorators/permissions.decorator";
import type { TenantContext } from "../../../../common/types/request-context";
import { ListAuditEventsUseCase } from "../../application/use-cases/list-audit-events.use-case";

@ApiBearerAuth()
@ApiTags("audit")
@Controller("audit-events")
export class AuditEventsController {
  constructor(private readonly listAuditEventsUseCase: ListAuditEventsUseCase) {}

  @Get()
  @Permissions("audit.read")
  async listAuditEvents(
    @CurrentTenant() tenant: TenantContext,
    @Query("limit") limit?: string
  ) {
    const parsedLimit = limit ? Number(limit) : 50;
    return this.listAuditEventsUseCase.execute(tenant.id, parsedLimit);
  }
}
