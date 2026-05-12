import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../database/prisma/prisma.service";
import type {
  CreateOrganizationRecordInput,
  OrganizationRecordEntity,
  OrganizationRecordKind
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
            country: input.country ?? "BO",
            city: input.city,
            timezone: input.timezone ?? "America/La_Paz"
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
}
