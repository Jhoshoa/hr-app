import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../../../database/prisma/prisma.service";
import type {
  CompensationRecordEntity,
  EmployeeCustomFieldDefinitionEntity,
  EmployeeCustomFieldValueEntity,
  EmployeeEntity,
  EmployeeJobAssignmentEntity,
  ManagerRelationshipEntity
} from "../../domain/entities/employee.entity";
import type {
  AddCompensationRecordInput,
  AddEmployeeJobAssignmentInput,
  AddManagerRelationshipInput,
  CreateEmployeeCustomFieldDefinitionInput,
  CreateEmployeeInput,
  EmployeeListFilters,
  EmployeesRepository,
  SetEmployeeCustomFieldValueInput,
  UpdateEmployeeProfileInput,
  UpdateEmployeeInput
} from "../../domain/ports/employees.repository.port";

type EmployeeWithDetails = Prisma.EmployeeGetPayload<{
  include: {
    profile: true;
    jobAssignments: true;
    managerRelations: true;
    compensation: true;
    customFieldValues: true;
  };
}>;

type EmployeeWithVisibleDetails = Prisma.EmployeeGetPayload<{
  include: {
    profile: true;
    jobAssignments: true;
    managerRelations: true;
    customFieldValues: true;
  };
}> & {
  compensation?: Prisma.CompensationRecordGetPayload<object>[];
};

@Injectable()
export class PrismaEmployeesRepository implements EmployeesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create = async (input: CreateEmployeeInput): Promise<EmployeeEntity> => {
    const employee = await this.prisma.employee.create({
      data: {
        tenantId: input.tenantId,
        userId: input.userId,
        employeeNumber: input.employeeNumber,
        firstName: input.firstName,
        lastName: input.lastName,
        workEmail: input.workEmail,
        personalEmail: input.personalEmail,
        startDate: input.startDate,
        profile: input.profile
          ? {
              create: input.profile
            }
          : undefined
      },
      include: this.employeeDetailsInclude
    });

    return this.toEmployeeEntity(employee);
  };

  update = async (input: UpdateEmployeeInput): Promise<EmployeeEntity> => {
    const employee = await this.prisma.employee.update({
      where: {
        id: input.employeeId,
        tenantId: input.tenantId
      },
      data: {
        status: input.status,
        firstName: input.firstName,
        lastName: input.lastName,
        workEmail: input.workEmail,
        personalEmail: input.personalEmail,
        terminationDate: input.terminationDate,
        profile: input.profile
          ? {
              upsert: {
                create: input.profile,
                update: input.profile
              }
            }
          : undefined
      },
      include: this.employeeDetailsInclude
    });

    return this.toEmployeeEntity(employee);
  };

  upsertProfile = async (input: UpdateEmployeeProfileInput): Promise<EmployeeEntity> => {
    const employee = await this.prisma.employee.update({
      where: {
        id: input.employeeId,
        tenantId: input.tenantId
      },
      data: {
        profile: {
          upsert: {
            create: input.profile,
            update: input.profile
          }
        }
      },
      include: this.employeeDetailsInclude
    });

    return this.toEmployeeEntity(employee);
  };

  deleteProfile = async (tenantId: string, employeeId: string): Promise<void> => {
    await this.prisma.employeeProfile.deleteMany({
      where: {
        employeeId,
        employee: { tenantId }
      }
    });
  };

  list = async (tenantId: string, filters: EmployeeListFilters): Promise<EmployeeEntity[]> => {
    const where: Prisma.EmployeeWhereInput = {
      tenantId,
      status: filters.status,
      jobAssignments: {
        some: {
          departmentId: filters.departmentId,
          locationId: filters.locationId,
          organizationUnitId: filters.organizationUnitId,
          effectiveTo: null
        }
      }
    };

    if (!filters.departmentId && !filters.locationId && !filters.organizationUnitId) {
      delete where.jobAssignments;
    }

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
        { workEmail: { contains: filters.search, mode: "insensitive" } },
        { employeeNumber: { contains: filters.search, mode: "insensitive" } }
      ];
    }

    const employees = await this.prisma.employee.findMany({
      where,
      include: {
        profile: true,
        jobAssignments: {
          where: { effectiveTo: null },
          orderBy: { effectiveFrom: "desc" }
        },
        managerRelations: {
          where: { effectiveTo: null },
          orderBy: { effectiveFrom: "desc" }
        },
        customFieldValues: true
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }]
    });

    return employees.map(this.toEmployeeEntity);
  };

  listDirectReportsByManagerUserId = async (
    tenantId: string,
    managerUserId: string,
    filters: EmployeeListFilters
  ): Promise<EmployeeEntity[]> => {
    const manager = await this.findByUserId(tenantId, managerUserId);

    if (!manager) {
      return [];
    }

    const where: Prisma.EmployeeWhereInput = {
      tenantId,
      status: filters.status,
      managerRelations: {
        some: {
          managerEmployeeId: manager.id,
          effectiveTo: null
        }
      }
    };

    if (filters.departmentId || filters.locationId || filters.organizationUnitId) {
      where.jobAssignments = {
        some: {
          departmentId: filters.departmentId,
          locationId: filters.locationId,
          organizationUnitId: filters.organizationUnitId,
          effectiveTo: null
        }
      };
    }

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
        { workEmail: { contains: filters.search, mode: "insensitive" } },
        { employeeNumber: { contains: filters.search, mode: "insensitive" } }
      ];
    }

    const employees = await this.prisma.employee.findMany({
      where,
      include: {
        profile: true,
        jobAssignments: {
          where: { effectiveTo: null },
          orderBy: { effectiveFrom: "desc" }
        },
        managerRelations: {
          where: { effectiveTo: null },
          orderBy: { effectiveFrom: "desc" }
        },
        customFieldValues: true
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }]
    });

    return employees.map(this.toEmployeeEntity);
  };

  findById = async (tenantId: string, employeeId: string): Promise<EmployeeEntity | null> => {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
      include: this.employeeDetailsInclude
    });

    return employee ? this.toEmployeeEntity(employee) : null;
  };

  findByUserId = async (tenantId: string, userId: string): Promise<EmployeeEntity | null> => {
    const employee = await this.prisma.employee.findFirst({
      where: { tenantId, userId },
      include: this.employeeDetailsInclude
    });

    return employee ? this.toEmployeeEntity(employee) : null;
  };

  addJobAssignment = async (
    input: AddEmployeeJobAssignmentInput
  ): Promise<EmployeeJobAssignmentEntity> =>
    this.prisma.employeeJobAssignment.create({
      data: {
        tenantId: input.tenantId,
        employeeId: input.employeeId,
        departmentId: input.departmentId,
        jobTitleId: input.jobTitleId,
        locationId: input.locationId,
        organizationUnitId: input.organizationUnitId,
        employmentTypeId: input.employmentTypeId,
        workModeId: input.workModeId,
        effectiveFrom: input.effectiveFrom,
        effectiveTo: input.effectiveTo
      }
    });

  addManagerRelationship = async (
    input: AddManagerRelationshipInput
  ): Promise<ManagerRelationshipEntity> =>
    this.prisma.managerRelationship.create({
      data: {
        tenantId: input.tenantId,
        employeeId: input.employeeId,
        managerEmployeeId: input.managerEmployeeId,
        effectiveFrom: input.effectiveFrom,
        effectiveTo: input.effectiveTo
      }
    });

  addCompensationRecord = async (
    input: AddCompensationRecordInput
  ): Promise<CompensationRecordEntity> => {
    const compensation = await this.prisma.compensationRecord.create({
      data: {
        tenantId: input.tenantId,
        employeeId: input.employeeId,
        amount: input.amount,
        currency: input.currency,
        frequency: input.frequency,
        visibility: input.visibility,
        effectiveFrom: input.effectiveFrom,
        effectiveTo: input.effectiveTo
      }
    });

    return this.toCompensationEntity(compensation);
  };

  createCustomFieldDefinition = async (
    input: CreateEmployeeCustomFieldDefinitionInput
  ): Promise<EmployeeCustomFieldDefinitionEntity> =>
    this.prisma.employeeCustomFieldDefinition.create({
      data: {
        tenantId: input.tenantId,
        key: input.key,
        label: input.label,
        type: input.type,
        isRequired: input.isRequired ?? false,
        visibility: input.visibility,
        options: input.options as Prisma.InputJsonValue | undefined
      }
    });

  setCustomFieldValue = async (
    input: SetEmployeeCustomFieldValueInput
  ): Promise<EmployeeCustomFieldValueEntity> =>
    this.prisma.employeeCustomFieldValue.upsert({
      where: {
        employeeId_fieldDefinitionId: {
          employeeId: input.employeeId,
          fieldDefinitionId: input.fieldDefinitionId
        }
      },
      update: {
        value: input.value as Prisma.InputJsonValue
      },
      create: {
        tenantId: input.tenantId,
        employeeId: input.employeeId,
        fieldDefinitionId: input.fieldDefinitionId,
        value: input.value as Prisma.InputJsonValue
      }
    });

  private readonly employeeDetailsInclude = {
    profile: true,
    jobAssignments: {
      orderBy: { effectiveFrom: "desc" }
    },
    managerRelations: {
      orderBy: { effectiveFrom: "desc" }
    },
    compensation: {
      orderBy: { effectiveFrom: "desc" }
    },
    customFieldValues: true
  } satisfies Prisma.EmployeeInclude;

  private toEmployeeEntity = (
    employee: EmployeeWithDetails | EmployeeWithVisibleDetails
  ): EmployeeEntity => ({
    id: employee.id,
    tenantId: employee.tenantId,
    userId: employee.userId,
    employeeNumber: employee.employeeNumber,
    status: employee.status,
    firstName: employee.firstName,
    lastName: employee.lastName,
    workEmail: employee.workEmail,
    personalEmail: employee.personalEmail,
    startDate: employee.startDate,
    terminationDate: employee.terminationDate,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
    profile: employee.profile,
    jobAssignments: employee.jobAssignments,
    managerRelationships: employee.managerRelations,
    compensation: (employee.compensation ?? []).map(this.toCompensationEntity),
    customFieldValues: employee.customFieldValues
  });

  private toCompensationEntity = (
    compensation: Prisma.CompensationRecordGetPayload<object>
  ): CompensationRecordEntity => ({
    id: compensation.id,
    employeeId: compensation.employeeId,
    amount: compensation.amount.toString(),
    currency: compensation.currency,
    frequency: compensation.frequency,
    visibility: compensation.visibility,
    effectiveFrom: compensation.effectiveFrom,
    effectiveTo: compensation.effectiveTo
  });
}
