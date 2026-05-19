import { Injectable, NotFoundException } from "@nestjs/common";
import { DEFAULT_COUNTRY_CODE } from "@hr-app/geo";
import { DEFAULT_TIME_ZONE } from "@hr-app/timezones";
import { PrismaService } from "../../../../database/prisma/prisma.service";
import type {
  CreateOrganizationRecordInput,
  OrganizationRecordEntity,
  OrganizationRecordKind,
  UpdateOrganizationRecordInput
} from "../../domain/entities/organization-record.entity";
import type { OrganizationRepository } from "../../domain/ports/organization.repository.port";

@Injectable()
export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  create = async (input: CreateOrganizationRecordInput): Promise<OrganizationRecordEntity> => {
    switch (input.kind) {
      case "department":
        return this.prisma.department.create({
          data: {
            tenantId: input.tenantId,
            name: input.name,
            parentDepartmentId: input.parentDepartmentId
          }
        });
      case "location":
        return this.prisma.location.create({
          data: {
            tenantId: input.tenantId,
            name: input.name,
            country: input.country ?? DEFAULT_COUNTRY_CODE,
            city: input.city,
            timezone: input.timezone ?? DEFAULT_TIME_ZONE
          }
        });
      case "jobTitle":
        return this.prisma.jobTitle.create({
          data: {
            tenantId: input.tenantId,
            name: input.name,
            level: input.level
          }
        });
      case "employmentType":
        return this.prisma.employmentType.create({
          data: {
            tenantId: input.tenantId,
            name: input.name,
            category: input.category
          }
        });
      case "workMode":
        return this.prisma.workMode.create({
          data: {
            tenantId: input.tenantId,
            name: input.name,
            type: input.type ?? input.name
          }
        });
      case "clientProject":
        return this.prisma.clientProject.create({
          data: {
            tenantId: input.tenantId,
            name: input.name,
            code: input.code
          }
        });
    }
  };

  list = async (
    tenantId: string,
    kind: OrganizationRecordKind
  ): Promise<OrganizationRecordEntity[]> => {
    switch (kind) {
      case "department":
        return this.prisma.department.findMany({ where: { tenantId }, orderBy: { name: "asc" } });
      case "location":
        return this.prisma.location.findMany({ where: { tenantId }, orderBy: { name: "asc" } });
      case "jobTitle":
        return this.prisma.jobTitle.findMany({ where: { tenantId }, orderBy: { name: "asc" } });
      case "employmentType":
        return this.prisma.employmentType.findMany({
          where: { tenantId },
          orderBy: { name: "asc" }
        });
      case "workMode":
        return this.prisma.workMode.findMany({ where: { tenantId }, orderBy: { name: "asc" } });
      case "clientProject":
        return this.prisma.clientProject.findMany({
          where: { tenantId },
          orderBy: { name: "asc" }
        });
    }
  };

  findById = async (
    tenantId: string,
    kind: OrganizationRecordKind,
    id: string
  ): Promise<OrganizationRecordEntity> => {
    const record = await this.findScopedRecord(tenantId, kind, id);

    if (!record) {
      throw new NotFoundException("Organization record was not found.");
    }

    return record;
  };

  update = async (input: UpdateOrganizationRecordInput): Promise<OrganizationRecordEntity> => {
    await this.findById(input.tenantId, input.kind, input.id);

    switch (input.kind) {
      case "department":
        return this.prisma.department.update({
          where: { id: input.id },
          data: {
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.parentDepartmentId !== undefined
              ? { parentDepartmentId: input.parentDepartmentId }
              : {})
          }
        });
      case "location":
        return this.prisma.location.update({
          where: { id: input.id },
          data: {
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.country !== undefined ? { country: input.country } : {}),
            ...(input.city !== undefined ? { city: input.city } : {}),
            ...(input.timezone !== undefined ? { timezone: input.timezone } : {})
          }
        });
      case "jobTitle":
        return this.prisma.jobTitle.update({
          where: { id: input.id },
          data: {
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.level !== undefined ? { level: input.level } : {})
          }
        });
      case "employmentType":
        return this.prisma.employmentType.update({
          where: { id: input.id },
          data: {
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.category !== undefined ? { category: input.category } : {})
          }
        });
      case "workMode":
        return this.prisma.workMode.update({
          where: { id: input.id },
          data: {
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.type !== undefined ? { type: input.type } : {})
          }
        });
      case "clientProject":
        return this.prisma.clientProject.update({
          where: { id: input.id },
          data: {
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.code !== undefined ? { code: input.code } : {})
          }
        });
    }
  };

  archive = async (
    tenantId: string,
    kind: OrganizationRecordKind,
    id: string
  ): Promise<OrganizationRecordEntity> => this.setStatus(tenantId, kind, id, "ARCHIVED");

  reactivate = async (
    tenantId: string,
    kind: OrganizationRecordKind,
    id: string
  ): Promise<OrganizationRecordEntity> => this.setStatus(tenantId, kind, id, "ACTIVE");

  private readonly setStatus = async (
    tenantId: string,
    kind: OrganizationRecordKind,
    id: string,
    status: "ACTIVE" | "ARCHIVED"
  ): Promise<OrganizationRecordEntity> => {
    await this.findById(tenantId, kind, id);

    switch (kind) {
      case "department":
        return this.prisma.department.update({ where: { id }, data: { status } });
      case "location":
        return this.prisma.location.update({ where: { id }, data: { status } });
      case "jobTitle":
        return this.prisma.jobTitle.update({ where: { id }, data: { status } });
      case "employmentType":
        return this.prisma.employmentType.update({ where: { id }, data: { status } });
      case "workMode":
        return this.prisma.workMode.update({ where: { id }, data: { status } });
      case "clientProject":
        return this.prisma.clientProject.update({ where: { id }, data: { status } });
    }
  };

  private readonly findScopedRecord = async (
    tenantId: string,
    kind: OrganizationRecordKind,
    id: string
  ): Promise<OrganizationRecordEntity | null> => {
    switch (kind) {
      case "department":
        return this.prisma.department.findFirst({ where: { id, tenantId } });
      case "location":
        return this.prisma.location.findFirst({ where: { id, tenantId } });
      case "jobTitle":
        return this.prisma.jobTitle.findFirst({ where: { id, tenantId } });
      case "employmentType":
        return this.prisma.employmentType.findFirst({ where: { id, tenantId } });
      case "workMode":
        return this.prisma.workMode.findFirst({ where: { id, tenantId } });
      case "clientProject":
        return this.prisma.clientProject.findFirst({ where: { id, tenantId } });
    }
  };
}
