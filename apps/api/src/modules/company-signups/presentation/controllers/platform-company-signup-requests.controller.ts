import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../../../common/decorators/current-user.decorator";
import { PlatformRoles } from "../../../../common/decorators/platform-roles.decorator";
import { SkipTenant } from "../../../../common/decorators/skip-tenant.decorator";
import type { AuthenticatedUserContext } from "../../../../common/types/request-context";
import { ApproveCompanySignupRequestUseCase } from "../../application/use-cases/approve-company-signup-request.use-case";
import { GetCompanySignupRequestUseCase } from "../../application/use-cases/get-company-signup-request.use-case";
import { ListCompanySignupRequestsUseCase } from "../../application/use-cases/list-company-signup-requests.use-case";
import { RejectCompanySignupRequestUseCase } from "../../application/use-cases/reject-company-signup-request.use-case";
import {
  ApproveCompanySignupRequestDto,
  ListCompanySignupRequestsQueryDto,
  RejectCompanySignupRequestDto
} from "../dto/platform-company-signup-request.dto";

@ApiBearerAuth()
@ApiTags("platform company signup requests")
@SkipTenant()
@Controller("platform/company-signup-requests")
export class PlatformCompanySignupRequestsController {
  constructor(
    private readonly listCompanySignupRequestsUseCase: ListCompanySignupRequestsUseCase,
    private readonly getCompanySignupRequestUseCase: GetCompanySignupRequestUseCase,
    private readonly approveCompanySignupRequestUseCase: ApproveCompanySignupRequestUseCase,
    private readonly rejectCompanySignupRequestUseCase: RejectCompanySignupRequestUseCase
  ) {}

  @Get()
  @PlatformRoles("PLATFORM_OWNER", "PLATFORM_ADMIN", "PLATFORM_SUPPORT")
  async list(@Query() query: ListCompanySignupRequestsQueryDto) {
    return this.listCompanySignupRequestsUseCase.execute(query);
  }

  @Get(":id")
  @PlatformRoles("PLATFORM_OWNER", "PLATFORM_ADMIN", "PLATFORM_SUPPORT")
  async get(@Param("id") id: string) {
    return this.getCompanySignupRequestUseCase.execute(id);
  }

  @Post(":id/approve")
  @PlatformRoles("PLATFORM_OWNER", "PLATFORM_ADMIN")
  async approve(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("id") id: string,
    @Body() body: ApproveCompanySignupRequestDto
  ) {
    return this.approveCompanySignupRequestUseCase.execute({
      signupRequestId: id,
      reviewedByUserId: user.id,
      finalTenantSlug: body.finalTenantSlug,
      initialAdminRoleKey: body.initialAdminRoleKey ?? "owner"
    });
  }

  @Post(":id/reject")
  @PlatformRoles("PLATFORM_OWNER", "PLATFORM_ADMIN")
  async reject(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("id") id: string,
    @Body() body: RejectCompanySignupRequestDto
  ) {
    return this.rejectCompanySignupRequestUseCase.execute({
      signupRequestId: id,
      reviewedByUserId: user.id,
      rejectionReason: body.rejectionReason
    });
  }
}
