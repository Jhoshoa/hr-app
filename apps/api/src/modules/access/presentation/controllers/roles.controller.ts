import { Body, Controller, Get, Param, Patch, Post, Put } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentTenant } from "../../../../common/decorators/current-tenant.decorator";
import { CurrentUser } from "../../../../common/decorators/current-user.decorator";
import { Permissions } from "../../../../common/decorators/permissions.decorator";
import type {
  AuthenticatedUserContext,
  TenantContext
} from "../../../../common/types/request-context";
import { ArchiveRoleUseCase } from "../../application/use-cases/archive-role.use-case";
import { CreateRoleUseCase } from "../../application/use-cases/create-role.use-case";
import { GetRoleUseCase } from "../../application/use-cases/get-role.use-case";
import { ListRolesUseCase } from "../../application/use-cases/list-roles.use-case";
import { ReactivateRoleUseCase } from "../../application/use-cases/reactivate-role.use-case";
import { UpdateRolePermissionsUseCase } from "../../application/use-cases/update-role-permissions.use-case";
import { UpdateRoleUseCase } from "../../application/use-cases/update-role.use-case";
import { CreateRoleDto, UpdateRoleDto, UpdateRolePermissionsDto } from "../dto/role.dto";

@ApiBearerAuth()
@ApiTags("access")
@Controller("roles")
export class RolesController {
  constructor(
    private readonly listRolesUseCase: ListRolesUseCase,
    private readonly getRoleUseCase: GetRoleUseCase,
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly updateRoleUseCase: UpdateRoleUseCase,
    private readonly updateRolePermissionsUseCase: UpdateRolePermissionsUseCase,
    private readonly archiveRoleUseCase: ArchiveRoleUseCase,
    private readonly reactivateRoleUseCase: ReactivateRoleUseCase
  ) {}

  @Get()
  @Permissions("roles.manage")
  async listRoles(@CurrentTenant() tenant: TenantContext) {
    const roles = await this.listRolesUseCase.execute(tenant.id);

    return { roles };
  }

  @Post()
  @Permissions("roles.manage")
  async createRole(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: CreateRoleDto
  ) {
    return this.createRoleUseCase.execute({
      tenantId: tenant.id,
      actorUserId: user.id,
      key: body.key,
      name: body.name,
      description: body.description,
      permissionIds: body.permissionIds ?? []
    });
  }

  @Get(":roleId")
  @Permissions("roles.manage")
  async getRole(@CurrentTenant() tenant: TenantContext, @Param("roleId") roleId: string) {
    return this.getRoleUseCase.execute(tenant.id, roleId);
  }

  @Patch(":roleId")
  @Permissions("roles.manage")
  async updateRole(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("roleId") roleId: string,
    @Body() body: UpdateRoleDto
  ) {
    return this.updateRoleUseCase.execute({
      tenantId: tenant.id,
      actorUserId: user.id,
      roleId,
      name: body.name,
      description: body.description
    });
  }

  @Put(":roleId/permissions")
  @Permissions("roles.manage")
  async updateRolePermissions(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("roleId") roleId: string,
    @Body() body: UpdateRolePermissionsDto
  ) {
    return this.updateRolePermissionsUseCase.execute({
      tenantId: tenant.id,
      actorUserId: user.id,
      roleId,
      permissionIds: body.permissionIds
    });
  }

  @Post(":roleId/archive")
  @Permissions("roles.manage")
  async archiveRole(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("roleId") roleId: string
  ) {
    return this.archiveRoleUseCase.execute({
      tenantId: tenant.id,
      actorUserId: user.id,
      roleId
    });
  }

  @Post(":roleId/reactivate")
  @Permissions("roles.manage")
  async reactivateRole(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("roleId") roleId: string
  ) {
    return this.reactivateRoleUseCase.execute({
      tenantId: tenant.id,
      actorUserId: user.id,
      roleId
    });
  }
}

