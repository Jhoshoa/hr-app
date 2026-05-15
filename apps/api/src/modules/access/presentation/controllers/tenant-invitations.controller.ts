import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentTenant } from "../../../../common/decorators/current-tenant.decorator";
import { CurrentUser } from "../../../../common/decorators/current-user.decorator";
import { Permissions } from "../../../../common/decorators/permissions.decorator";
import { Public } from "../../../../common/decorators/public.decorator";
import { SkipTenant } from "../../../../common/decorators/skip-tenant.decorator";
import type {
  AuthenticatedUserContext,
  TenantContext
} from "../../../../common/types/request-context";
import { AcceptTenantInvitationUseCase } from "../../application/use-cases/accept-tenant-invitation.use-case";
import { CancelTenantInvitationUseCase } from "../../application/use-cases/cancel-tenant-invitation.use-case";
import { CreateTenantInvitationUseCase } from "../../application/use-cases/create-tenant-invitation.use-case";
import { ListTenantInvitationsUseCase } from "../../application/use-cases/list-tenant-invitations.use-case";
import { PreviewTenantInvitationUseCase } from "../../application/use-cases/preview-tenant-invitation.use-case";
import { ResendTenantInvitationUseCase } from "../../application/use-cases/resend-tenant-invitation.use-case";
import {
  AcceptTenantInvitationDto,
  CreateTenantInvitationDto,
  PreviewTenantInvitationQueryDto
} from "../dto/tenant-invitation.dto";

@ApiBearerAuth()
@ApiTags("access")
@Controller("tenant-invitations")
export class TenantInvitationsController {
  constructor(
    private readonly listTenantInvitationsUseCase: ListTenantInvitationsUseCase,
    private readonly createTenantInvitationUseCase: CreateTenantInvitationUseCase,
    private readonly resendTenantInvitationUseCase: ResendTenantInvitationUseCase,
    private readonly cancelTenantInvitationUseCase: CancelTenantInvitationUseCase,
    private readonly acceptTenantInvitationUseCase: AcceptTenantInvitationUseCase,
    private readonly previewTenantInvitationUseCase: PreviewTenantInvitationUseCase
  ) {}

  @Get()
  @Permissions("users.read")
  async listTenantInvitations(@CurrentTenant() tenant: TenantContext) {
    const invitations = await this.listTenantInvitationsUseCase.execute(tenant.id);

    return { invitations };
  }

  @Post()
  @Permissions("users.manage")
  async createTenantInvitation(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: CreateTenantInvitationDto
  ) {
    return this.createTenantInvitationUseCase.execute({
      tenantId: tenant.id,
      actorUserId: user.id,
      email: body.email,
      roleIds: body.roleIds
    });
  }

  @Post("accept")
  @SkipTenant()
  async acceptTenantInvitation(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: AcceptTenantInvitationDto
  ) {
    return this.acceptTenantInvitationUseCase.execute({
      token: body.token,
      userId: user.id,
      userEmail: user.email
    });
  }

  @Get("preview")
  @Public()
  @SkipTenant()
  async previewTenantInvitation(@Query() query: PreviewTenantInvitationQueryDto) {
    return this.previewTenantInvitationUseCase.execute(query.token);
  }

  @Post(":invitationId/resend")
  @Permissions("users.manage")
  async resendTenantInvitation(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("invitationId") invitationId: string
  ) {
    return this.resendTenantInvitationUseCase.execute({
      tenantId: tenant.id,
      actorUserId: user.id,
      invitationId
    });
  }

  @Post(":invitationId/cancel")
  @Permissions("users.manage")
  async cancelTenantInvitation(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("invitationId") invitationId: string
  ) {
    return this.cancelTenantInvitationUseCase.execute({
      tenantId: tenant.id,
      actorUserId: user.id,
      invitationId
    });
  }

}
