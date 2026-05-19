import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentTenant } from "../../../../common/decorators/current-tenant.decorator";
import { CurrentUser } from "../../../../common/decorators/current-user.decorator";
import { Permissions } from "../../../../common/decorators/permissions.decorator";
import type {
  AuthenticatedUserContext,
  TenantContext
} from "../../../../common/types/request-context";
import { ArchiveOrganizationUnitTypeUseCase } from "../../application/use-cases/archive-organization-unit-type.use-case";
import { ArchiveOrganizationUnitUseCase } from "../../application/use-cases/archive-organization-unit.use-case";
import { CreateOrganizationUnitTypeUseCase } from "../../application/use-cases/create-organization-unit-type.use-case";
import { CreateOrganizationUnitUseCase } from "../../application/use-cases/create-organization-unit.use-case";
import { DeleteOrganizationUnitTypeUseCase } from "../../application/use-cases/delete-organization-unit-type.use-case";
import { DeleteOrganizationUnitUseCase } from "../../application/use-cases/delete-organization-unit.use-case";
import { GetOrganizationUnitTypeUseCase } from "../../application/use-cases/get-organization-unit-type.use-case";
import { GetOrganizationUnitUseCase } from "../../application/use-cases/get-organization-unit.use-case";
import { ListOrganizationUnitTypesUseCase } from "../../application/use-cases/list-organization-unit-types.use-case";
import { ListOrganizationUnitsUseCase } from "../../application/use-cases/list-organization-units.use-case";
import { ReactivateOrganizationUnitTypeUseCase } from "../../application/use-cases/reactivate-organization-unit-type.use-case";
import { ReactivateOrganizationUnitUseCase } from "../../application/use-cases/reactivate-organization-unit.use-case";
import { ReorderOrganizationUnitTypesUseCase } from "../../application/use-cases/reorder-organization-unit-types.use-case";
import { UpdateOrganizationUnitTypeUseCase } from "../../application/use-cases/update-organization-unit-type.use-case";
import { UpdateOrganizationUnitUseCase } from "../../application/use-cases/update-organization-unit.use-case";
import {
  CreateOrganizationUnitDto,
  CreateOrganizationUnitTypeDto,
  ReorderOrganizationUnitTypesDto,
  UpdateOrganizationUnitDto,
  UpdateOrganizationUnitTypeDto
} from "../dto/organization-unit.dto";

@ApiBearerAuth()
@ApiTags("organization")
@Controller()
export class OrganizationUnitsController {
  constructor(
    private readonly listOrganizationUnitTypesUseCase: ListOrganizationUnitTypesUseCase,
    private readonly getOrganizationUnitTypeUseCase: GetOrganizationUnitTypeUseCase,
    private readonly createOrganizationUnitTypeUseCase: CreateOrganizationUnitTypeUseCase,
    private readonly updateOrganizationUnitTypeUseCase: UpdateOrganizationUnitTypeUseCase,
    private readonly archiveOrganizationUnitTypeUseCase: ArchiveOrganizationUnitTypeUseCase,
    private readonly reactivateOrganizationUnitTypeUseCase: ReactivateOrganizationUnitTypeUseCase,
    private readonly deleteOrganizationUnitTypeUseCase: DeleteOrganizationUnitTypeUseCase,
    private readonly reorderOrganizationUnitTypesUseCase: ReorderOrganizationUnitTypesUseCase,
    private readonly listOrganizationUnitsUseCase: ListOrganizationUnitsUseCase,
    private readonly getOrganizationUnitUseCase: GetOrganizationUnitUseCase,
    private readonly createOrganizationUnitUseCase: CreateOrganizationUnitUseCase,
    private readonly updateOrganizationUnitUseCase: UpdateOrganizationUnitUseCase,
    private readonly archiveOrganizationUnitUseCase: ArchiveOrganizationUnitUseCase,
    private readonly reactivateOrganizationUnitUseCase: ReactivateOrganizationUnitUseCase,
    private readonly deleteOrganizationUnitUseCase: DeleteOrganizationUnitUseCase
  ) {}

  @Get("organization-unit-types")
  @Permissions("organization.read")
  async listTypes(@CurrentTenant() tenant: TenantContext) {
    return this.listOrganizationUnitTypesUseCase.execute(tenant.id);
  }

  @Post("organization-unit-types")
  @Permissions("organization.manage")
  async createType(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: CreateOrganizationUnitTypeDto
  ) {
    return this.createOrganizationUnitTypeUseCase.execute({
      tenantId: tenant.id,
      actorUserId: user.id,
      ...body
    });
  }

  @Get("organization-unit-types/:typeId")
  @Permissions("organization.read")
  async getType(@CurrentTenant() tenant: TenantContext, @Param("typeId") typeId: string) {
    return this.getOrganizationUnitTypeUseCase.execute(tenant.id, typeId);
  }

  @Put("organization-unit-types/order")
  @Permissions("organization.manage")
  async reorderTypes(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: ReorderOrganizationUnitTypesDto
  ) {
    return this.reorderOrganizationUnitTypesUseCase.execute({
      tenantId: tenant.id,
      actorUserId: user.id,
      typeIds: body.typeIds
    });
  }

  @Patch("organization-unit-types/:typeId")
  @Permissions("organization.manage")
  async updateType(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("typeId") typeId: string,
    @Body() body: UpdateOrganizationUnitTypeDto
  ) {
    return this.updateOrganizationUnitTypeUseCase.execute({
      tenantId: tenant.id,
      actorUserId: user.id,
      typeId,
      ...body
    });
  }

  @Post("organization-unit-types/:typeId/archive")
  @Permissions("organization.manage")
  async archiveType(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("typeId") typeId: string
  ) {
    return this.archiveOrganizationUnitTypeUseCase.execute(tenant.id, typeId, user.id);
  }

  @Post("organization-unit-types/:typeId/reactivate")
  @Permissions("organization.manage")
  async reactivateType(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("typeId") typeId: string
  ) {
    return this.reactivateOrganizationUnitTypeUseCase.execute(tenant.id, typeId, user.id);
  }

  @Delete("organization-unit-types/:typeId")
  @Permissions("organization.manage")
  async deleteType(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("typeId") typeId: string
  ) {
    return this.deleteOrganizationUnitTypeUseCase.execute(tenant.id, typeId, user.id);
  }

  @Get("organization-units")
  @Permissions("organization.read")
  async listUnits(@CurrentTenant() tenant: TenantContext) {
    return this.listOrganizationUnitsUseCase.execute(tenant.id);
  }

  @Post("organization-units")
  @Permissions("organization.manage")
  async createUnit(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: CreateOrganizationUnitDto
  ) {
    return this.createOrganizationUnitUseCase.execute({
      tenantId: tenant.id,
      actorUserId: user.id,
      ...body
    });
  }

  @Get("organization-units/:unitId")
  @Permissions("organization.read")
  async getUnit(@CurrentTenant() tenant: TenantContext, @Param("unitId") unitId: string) {
    return this.getOrganizationUnitUseCase.execute(tenant.id, unitId);
  }

  @Patch("organization-units/:unitId")
  @Permissions("organization.manage")
  async updateUnit(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("unitId") unitId: string,
    @Body() body: UpdateOrganizationUnitDto
  ) {
    return this.updateOrganizationUnitUseCase.execute({
      tenantId: tenant.id,
      actorUserId: user.id,
      unitId,
      ...body
    });
  }

  @Post("organization-units/:unitId/archive")
  @Permissions("organization.manage")
  async archiveUnit(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("unitId") unitId: string
  ) {
    return this.archiveOrganizationUnitUseCase.execute(tenant.id, unitId, user.id);
  }

  @Post("organization-units/:unitId/reactivate")
  @Permissions("organization.manage")
  async reactivateUnit(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("unitId") unitId: string
  ) {
    return this.reactivateOrganizationUnitUseCase.execute(tenant.id, unitId, user.id);
  }

  @Delete("organization-units/:unitId")
  @Permissions("organization.manage")
  async deleteUnit(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("unitId") unitId: string
  ) {
    return this.deleteOrganizationUnitUseCase.execute(tenant.id, unitId, user.id);
  }
}
