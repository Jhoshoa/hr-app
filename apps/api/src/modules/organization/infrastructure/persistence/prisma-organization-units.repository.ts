import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../database/prisma/prisma.service";
import type {
  CreateOrganizationUnitInput,
  OrganizationUnitEntity,
  UpdateOrganizationUnitInput
} from "../../domain/entities/organization-unit.entity";
import type {
  CreateOrganizationUnitTypeInput,
  OrganizationUnitTypeEntity,
  UpdateOrganizationUnitTypeInput
} from "../../domain/entities/organization-unit-type.entity";
import type { OrganizationUnitsRepository } from "../../domain/ports/organization-units.repository.port";

@Injectable()
export class PrismaOrganizationUnitsRepository implements OrganizationUnitsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listTypes = async (tenantId: string): Promise<OrganizationUnitTypeEntity[]> =>
    this.prisma.organizationUnitType.findMany({
      where: { tenantId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    });

  getMaxTypeSortOrder = async (tenantId: string): Promise<number | null> => {
    const result = await this.prisma.organizationUnitType.aggregate({
      where: { tenantId },
      _max: { sortOrder: true }
    });

    return result._max.sortOrder;
  };

  findTypeById = async (
    tenantId: string,
    typeId: string
  ): Promise<OrganizationUnitTypeEntity | null> =>
    this.prisma.organizationUnitType.findFirst({ where: { id: typeId, tenantId } });

  findTypeByKey = async (
    tenantId: string,
    key: string
  ): Promise<OrganizationUnitTypeEntity | null> =>
    this.prisma.organizationUnitType.findFirst({ where: { tenantId, key } });

  findTypeByName = async (
    tenantId: string,
    name: string
  ): Promise<OrganizationUnitTypeEntity | null> =>
    this.prisma.organizationUnitType.findFirst({ where: { tenantId, name } });

  createType = async (
    input: CreateOrganizationUnitTypeInput
  ): Promise<OrganizationUnitTypeEntity> =>
    this.prisma.organizationUnitType.create({
      data: {
        tenantId: input.tenantId,
        key: input.key,
        name: input.name,
        sortOrder: input.sortOrder ?? 0
      }
    });

  updateType = async (
    input: UpdateOrganizationUnitTypeInput
  ): Promise<OrganizationUnitTypeEntity> =>
    this.prisma.organizationUnitType.update({
      where: { id: input.typeId },
      data: {
        ...(input.key !== undefined ? { key: input.key } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {})
      }
    });

  reorderTypes = async (
    tenantId: string,
    typeIds: readonly string[]
  ): Promise<OrganizationUnitTypeEntity[]> =>
    this.prisma.$transaction(async (tx) => {
      await Promise.all(
        typeIds.map((typeId, index) =>
          tx.organizationUnitType.update({
            where: { id: typeId, tenantId },
            data: { sortOrder: index }
          })
        )
      );

      return tx.organizationUnitType.findMany({
        where: { tenantId },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
      });
    });

  deleteType = async (
    tenantId: string,
    typeId: string
  ): Promise<OrganizationUnitTypeEntity> => {
    await this.findTypeById(tenantId, typeId);

    return this.prisma.organizationUnitType.delete({ where: { id: typeId } });
  };

  setTypeStatus = async (
    tenantId: string,
    typeId: string,
    status: "ACTIVE" | "ARCHIVED"
  ): Promise<OrganizationUnitTypeEntity> => {
    await this.findTypeById(tenantId, typeId);

    return this.prisma.organizationUnitType.update({ where: { id: typeId }, data: { status } });
  };

  countUnitsByType = async (tenantId: string, typeId: string): Promise<number> =>
    this.prisma.organizationUnit.count({ where: { tenantId, typeId } });

  countActiveUnitsByType = async (tenantId: string, typeId: string): Promise<number> =>
    this.prisma.organizationUnit.count({ where: { tenantId, typeId, status: "ACTIVE" } });

  listUnits = async (tenantId: string): Promise<OrganizationUnitEntity[]> => {
    const units = await this.prisma.organizationUnit.findMany({
      where: { tenantId },
      include: this.unitInclude,
      orderBy: [{ name: "asc" }]
    });

    return units.map(this.toUnitEntity);
  };

  findUnitById = async (tenantId: string, unitId: string): Promise<OrganizationUnitEntity | null> => {
    const unit = await this.prisma.organizationUnit.findFirst({
      where: { id: unitId, tenantId },
      include: this.unitInclude
    });

    return unit ? this.toUnitEntity(unit) : null;
  };

  findUnitByName = async (tenantId: string, name: string): Promise<OrganizationUnitEntity | null> => {
    const unit = await this.prisma.organizationUnit.findFirst({
      where: { tenantId, name },
      include: this.unitInclude
    });

    return unit ? this.toUnitEntity(unit) : null;
  };

  findUnitByKey = async (tenantId: string, key: string): Promise<OrganizationUnitEntity | null> => {
    const unit = await this.prisma.organizationUnit.findFirst({
      where: { tenantId, key },
      include: this.unitInclude
    });

    return unit ? this.toUnitEntity(unit) : null;
  };

  findUnitByCode = async (tenantId: string, code: string): Promise<OrganizationUnitEntity | null> => {
    const unit = await this.prisma.organizationUnit.findFirst({
      where: { tenantId, code },
      include: this.unitInclude
    });

    return unit ? this.toUnitEntity(unit) : null;
  };

  createUnit = async (input: CreateOrganizationUnitInput): Promise<OrganizationUnitEntity> => {
    const unit = await this.prisma.organizationUnit.create({
      data: {
        tenantId: input.tenantId,
        typeId: input.typeId,
        parentOrganizationUnitId: input.parentOrganizationUnitId,
        primaryLocationId: input.primaryLocationId,
        key: input.key,
        name: input.name,
        legalName: input.legalName,
        code: input.code
      },
      include: this.unitInclude
    });

    return this.toUnitEntity(unit);
  };

  updateUnit = async (input: UpdateOrganizationUnitInput): Promise<OrganizationUnitEntity> => {
    const unit = await this.prisma.organizationUnit.update({
      where: { id: input.unitId },
      data: {
        ...(input.typeId !== undefined ? { typeId: input.typeId } : {}),
        ...(input.parentOrganizationUnitId !== undefined
          ? { parentOrganizationUnitId: input.parentOrganizationUnitId }
          : {}),
        ...(input.primaryLocationId !== undefined ? { primaryLocationId: input.primaryLocationId } : {}),
        ...(input.key !== undefined ? { key: input.key } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.legalName !== undefined ? { legalName: input.legalName } : {}),
        ...(input.code !== undefined ? { code: input.code } : {})
      },
      include: this.unitInclude
    });

    return this.toUnitEntity(unit);
  };

  setUnitStatus = async (
    tenantId: string,
    unitId: string,
    status: "ACTIVE" | "ARCHIVED"
  ): Promise<OrganizationUnitEntity> => {
    await this.findUnitById(tenantId, unitId);
    const unit = await this.prisma.organizationUnit.update({
      where: { id: unitId },
      data: { status },
      include: this.unitInclude
    });

    return this.toUnitEntity(unit);
  };

  deleteUnit = async (tenantId: string, unitId: string): Promise<OrganizationUnitEntity> => {
    await this.findUnitById(tenantId, unitId);
    const unit = await this.prisma.organizationUnit.delete({
      where: { id: unitId },
      include: this.unitInclude
    });

    return this.toUnitEntity(unit);
  };

  countChildren = async (tenantId: string, unitId: string): Promise<number> =>
    this.prisma.organizationUnit.count({
      where: { tenantId, parentOrganizationUnitId: unitId }
    });

  countActiveChildren = async (tenantId: string, unitId: string): Promise<number> =>
    this.prisma.organizationUnit.count({
      where: { tenantId, parentOrganizationUnitId: unitId, status: "ACTIVE" }
    });

  countJobAssignmentsByUnit = async (tenantId: string, unitId: string): Promise<number> =>
    this.prisma.employeeJobAssignment.count({
      where: { tenantId, organizationUnitId: unitId }
    });

  countCurrentJobAssignments = async (tenantId: string, unitId: string): Promise<number> =>
    this.prisma.employeeJobAssignment.count({
      where: { tenantId, organizationUnitId: unitId, effectiveTo: null }
    });

  countBlockingAuditEvents = async (
    tenantId: string,
    resourceType: "organization_unit" | "organization_unit_type",
    resourceId: string,
    ignoredActions: readonly string[]
  ): Promise<number> =>
    this.prisma.auditEvent.count({
      where: {
        tenantId,
        resourceType,
        resourceId,
        action: { notIn: [...ignoredActions] }
      }
    });

  findAncestorIds = async (tenantId: string, unitId: string): Promise<string[]> => {
    const ancestorIds: string[] = [];
    let currentId: string | null = unitId;

    while (currentId) {
      const unit: { parentOrganizationUnitId: string | null } | null =
        await this.prisma.organizationUnit.findFirst({
        where: { id: currentId, tenantId },
        select: { parentOrganizationUnitId: true }
        });

      if (!unit?.parentOrganizationUnitId) {
        return ancestorIds;
      }

      ancestorIds.push(unit.parentOrganizationUnitId);
      currentId = unit.parentOrganizationUnitId;
    }

    return ancestorIds;
  };

  activeLocationExists = async (tenantId: string, locationId: string): Promise<boolean> => {
    const location = await this.prisma.location.findFirst({
      where: { id: locationId, tenantId, status: "ACTIVE" },
      select: { id: true }
    });

    return Boolean(location);
  };

  private readonly unitInclude = {
    type: { select: { id: true, key: true, name: true } },
    parentOrganizationUnit: { select: { id: true, key: true, name: true } },
    primaryLocation: { select: { id: true, name: true, city: true, country: true } }
  } as const;

  private readonly toUnitEntity = (unit: {
    id: string;
    tenantId: string;
    parentOrganizationUnitId: string | null;
    typeId: string;
    primaryLocationId: string | null;
    key: string | null;
    name: string;
    legalName: string | null;
    code: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    type?: { id: string; key: string; name: string };
    parentOrganizationUnit?: { id: string; key: string | null; name: string } | null;
    primaryLocation?: { id: string; name: string; city: string | null; country: string } | null;
  }): OrganizationUnitEntity => ({
    id: unit.id,
    tenantId: unit.tenantId,
    parentOrganizationUnitId: unit.parentOrganizationUnitId,
    typeId: unit.typeId,
    primaryLocationId: unit.primaryLocationId,
    key: unit.key,
    name: unit.name,
    legalName: unit.legalName,
    code: unit.code,
    status: unit.status,
    createdAt: unit.createdAt,
    updatedAt: unit.updatedAt,
    type: unit.type,
    parent: unit.parentOrganizationUnit ?? null,
    primaryLocation: unit.primaryLocation ?? null
  });
}
