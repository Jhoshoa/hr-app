import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentTenant } from "../../../../common/decorators/current-tenant.decorator";
import { CurrentUser } from "../../../../common/decorators/current-user.decorator";
import { Permissions } from "../../../../common/decorators/permissions.decorator";
import type {
  AuthenticatedUserContext,
  TenantContext
} from "../../../../common/types/request-context";
import { DisableTenantMembershipUseCase } from "../../application/use-cases/disable-tenant-membership.use-case";
import { GetTenantUserUseCase } from "../../application/use-cases/get-tenant-user.use-case";
import { ListTenantUsersUseCase } from "../../application/use-cases/list-tenant-users.use-case";
import { ReactivateTenantMembershipUseCase } from "../../application/use-cases/reactivate-tenant-membership.use-case";
import { UpdateTenantUserRolesUseCase } from "../../application/use-cases/update-tenant-user-roles.use-case";
import { UpdateTenantUserRolesDto } from "../dto/tenant-user.dto";

@ApiBearerAuth()
@ApiTags("access")
@Controller("tenant-users")
export class TenantUsersController {
  constructor(
    private readonly listTenantUsersUseCase: ListTenantUsersUseCase,
    private readonly getTenantUserUseCase: GetTenantUserUseCase,
    private readonly updateTenantUserRolesUseCase: UpdateTenantUserRolesUseCase,
    private readonly disableTenantMembershipUseCase: DisableTenantMembershipUseCase,
    private readonly reactivateTenantMembershipUseCase: ReactivateTenantMembershipUseCase
  ) {}

  @Get()
  @Permissions("users.read")
  async listTenantUsers(@CurrentTenant() tenant: TenantContext) {
    const users = await this.listTenantUsersUseCase.execute(tenant.id);

    return { users };
  }

  @Get(":membershipId")
  @Permissions("users.read")
  async getTenantUser(
    @CurrentTenant() tenant: TenantContext,
    @Param("membershipId") membershipId: string
  ) {
    return this.getTenantUserUseCase.execute(tenant.id, membershipId);
  }

  @Put(":membershipId/roles")
  @Permissions("users.manage")
  async updateTenantUserRoles(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("membershipId") membershipId: string,
    @Body() body: UpdateTenantUserRolesDto
  ) {
    return this.updateTenantUserRolesUseCase.execute({
      tenantId: tenant.id,
      actorUserId: user.id,
      membershipId,
      roleIds: body.roleIds
    });
  }

  @Post(":membershipId/disable")
  @Permissions("users.manage")
  async disableTenantMembership(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("membershipId") membershipId: string
  ) {
    return this.disableTenantMembershipUseCase.execute({
      tenantId: tenant.id,
      actorUserId: user.id,
      membershipId
    });
  }

  @Post(":membershipId/reactivate")
  @Permissions("users.manage")
  async reactivateTenantMembership(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("membershipId") membershipId: string
  ) {
    return this.reactivateTenantMembershipUseCase.execute({
      tenantId: tenant.id,
      actorUserId: user.id,
      membershipId
    });
  }
}

