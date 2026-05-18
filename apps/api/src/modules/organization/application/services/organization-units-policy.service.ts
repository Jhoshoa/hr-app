import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { OrganizationUnitEntity } from "../../domain/entities/organization-unit.entity";
import type { OrganizationUnitTypeEntity } from "../../domain/entities/organization-unit-type.entity";
import type { OrganizationUnitsRepository } from "../../domain/ports/organization-units.repository.port";

@Injectable()
export class OrganizationUnitsPolicyService {
  assertTypeExists = (type: OrganizationUnitTypeEntity | null): OrganizationUnitTypeEntity => {
    if (!type) {
      throw new NotFoundException("Organization unit type was not found.");
    }

    return type;
  };

  assertUnitExists = (unit: OrganizationUnitEntity | null): OrganizationUnitEntity => {
    if (!unit) {
      throw new NotFoundException("Organization unit was not found.");
    }

    return unit;
  };

  assertTypeIsActive = (type: OrganizationUnitTypeEntity): void => {
    if (type.status !== "ACTIVE") {
      throw new BadRequestException("Organization unit type must be active.");
    }
  };

  assertUnitIsActive = (unit: OrganizationUnitEntity): void => {
    if (unit.status !== "ACTIVE") {
      throw new BadRequestException("Parent organization unit must be active.");
    }
  };

  assertTypeIsArchived = (type: OrganizationUnitTypeEntity): void => {
    if (type.status !== "ARCHIVED") {
      throw new BadRequestException("Organization unit type must be archived before it can be deleted.");
    }
  };

  assertUnitIsArchived = (unit: OrganizationUnitEntity): void => {
    if (unit.status !== "ARCHIVED") {
      throw new BadRequestException("Organization unit must be archived before it can be deleted.");
    }
  };

  assertTypeKeyAvailable = async (
    repository: OrganizationUnitsRepository,
    tenantId: string,
    key: string,
    currentTypeId?: string
  ): Promise<void> => {
    const existing = await repository.findTypeByKey(tenantId, key);

    if (existing && existing.id !== currentTypeId) {
      throw new ConflictException("Organization unit type key already exists.");
    }
  };

  assertTypeNameAvailable = async (
    repository: OrganizationUnitsRepository,
    tenantId: string,
    name: string,
    currentTypeId?: string
  ): Promise<void> => {
    const existing = await repository.findTypeByName(tenantId, name);

    if (existing && existing.id !== currentTypeId) {
      throw new ConflictException("Organization unit type name already exists.");
    }
  };

  assertUnitNameAvailable = async (
    repository: OrganizationUnitsRepository,
    tenantId: string,
    name: string,
    currentUnitId?: string
  ): Promise<void> => {
    const existing = await repository.findUnitByName(tenantId, name);

    if (existing && existing.id !== currentUnitId) {
      throw new ConflictException("Organization unit name already exists.");
    }
  };

  assertUnitKeyAvailable = async (
    repository: OrganizationUnitsRepository,
    tenantId: string,
    key: string | null | undefined,
    currentUnitId?: string
  ): Promise<void> => {
    if (!key) {
      return;
    }

    const existing = await repository.findUnitByKey(tenantId, key);

    if (existing && existing.id !== currentUnitId) {
      throw new ConflictException("Organization unit key already exists.");
    }
  };

  assertUnitCodeAvailable = async (
    repository: OrganizationUnitsRepository,
    tenantId: string,
    code: string | null | undefined,
    currentUnitId?: string
  ): Promise<void> => {
    if (!code) {
      return;
    }

    const existing = await repository.findUnitByCode(tenantId, code);

    if (existing && existing.id !== currentUnitId) {
      throw new ConflictException("Organization unit code already exists.");
    }
  };

  assertTypeCanBeArchived = async (
    repository: OrganizationUnitsRepository,
    tenantId: string,
    typeId: string
  ): Promise<void> => {
    const activeUnits = await repository.countActiveUnitsByType(tenantId, typeId);

    if (activeUnits > 0) {
      throw new ConflictException("Organization unit type cannot be archived while active units use it.");
    }
  };

  assertTypeCanBeDeleted = async (
    repository: OrganizationUnitsRepository,
    tenantId: string,
    typeId: string
  ): Promise<void> => {
    const units = await repository.countUnitsByType(tenantId, typeId);

    if (units > 0) {
      throw new ConflictException("Organization unit type cannot be deleted while organization units use it.");
    }

    const blockingAuditEvents = await repository.countBlockingAuditEvents(
      tenantId,
      "organization_unit_type",
      typeId,
      [
        "organization_unit_type.created",
        "organization_unit_type.archived",
        "organization_unit_type.reactivated"
      ]
    );

    if (blockingAuditEvents > 0) {
      throw new ConflictException("Organization unit type cannot be deleted because it has operational history.");
    }
  };

  assertUnitCanBeArchived = async (
    repository: OrganizationUnitsRepository,
    tenantId: string,
    unitId: string
  ): Promise<void> => {
    const activeChildren = await repository.countActiveChildren(tenantId, unitId);

    if (activeChildren > 0) {
      throw new ConflictException("Organization unit cannot be archived while it has active child units.");
    }

    const currentAssignments = await repository.countCurrentJobAssignments(tenantId, unitId);

    if (currentAssignments > 0) {
      throw new ConflictException("Organization unit cannot be archived while current job assignments use it.");
    }
  };

  assertUnitCanBeDeleted = async (
    repository: OrganizationUnitsRepository,
    tenantId: string,
    unitId: string
  ): Promise<void> => {
    const children = await repository.countChildren(tenantId, unitId);

    if (children > 0) {
      throw new ConflictException("Organization unit cannot be deleted while it has child units.");
    }

    const jobAssignments = await repository.countJobAssignmentsByUnit(tenantId, unitId);

    if (jobAssignments > 0) {
      throw new ConflictException("Organization unit cannot be deleted while job assignments use it.");
    }

    const blockingAuditEvents = await repository.countBlockingAuditEvents(
      tenantId,
      "organization_unit",
      unitId,
      [
        "organization_unit.created",
        "organization_unit.archived",
        "organization_unit.reactivated"
      ]
    );

    if (blockingAuditEvents > 0) {
      throw new ConflictException("Organization unit cannot be deleted because it has operational history.");
    }
  };

  assertParentDoesNotCreateCycle = async (
    repository: OrganizationUnitsRepository,
    tenantId: string,
    unitId: string,
    parentOrganizationUnitId?: string | null
  ): Promise<void> => {
    if (!parentOrganizationUnitId) {
      return;
    }

    if (parentOrganizationUnitId === unitId) {
      throw new BadRequestException("Organization unit cannot be its own parent.");
    }

    const ancestorIds = await repository.findAncestorIds(tenantId, parentOrganizationUnitId);

    if (ancestorIds.includes(unitId)) {
      throw new BadRequestException("Organization unit hierarchy cannot contain cycles.");
    }
  };
}
