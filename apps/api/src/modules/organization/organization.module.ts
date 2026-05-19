import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { TenantsModule } from "../tenants/tenants.module";
import { CreateOrganizationRecordUseCase } from "./application/use-cases/create-organization-record.use-case";
import { ListOrganizationRecordsUseCase } from "./application/use-cases/list-organization-records.use-case";
import { GetOrganizationRecordUseCase } from "./application/use-cases/get-organization-record.use-case";
import { UpdateOrganizationRecordUseCase } from "./application/use-cases/update-organization-record.use-case";
import { ArchiveOrganizationRecordUseCase } from "./application/use-cases/archive-organization-record.use-case";
import { ReactivateOrganizationRecordUseCase } from "./application/use-cases/reactivate-organization-record.use-case";
import { ArchiveOrganizationUnitTypeUseCase } from "./application/use-cases/archive-organization-unit-type.use-case";
import { ArchiveOrganizationUnitUseCase } from "./application/use-cases/archive-organization-unit.use-case";
import { CreateOrganizationUnitTypeUseCase } from "./application/use-cases/create-organization-unit-type.use-case";
import { CreateOrganizationUnitUseCase } from "./application/use-cases/create-organization-unit.use-case";
import { DeleteOrganizationUnitTypeUseCase } from "./application/use-cases/delete-organization-unit-type.use-case";
import { DeleteOrganizationUnitUseCase } from "./application/use-cases/delete-organization-unit.use-case";
import { GetOrganizationUnitTypeUseCase } from "./application/use-cases/get-organization-unit-type.use-case";
import { GetOrganizationUnitUseCase } from "./application/use-cases/get-organization-unit.use-case";
import { ListOrganizationUnitTypesUseCase } from "./application/use-cases/list-organization-unit-types.use-case";
import { ListOrganizationUnitsUseCase } from "./application/use-cases/list-organization-units.use-case";
import { OrganizationUnitsPolicyService } from "./application/services/organization-units-policy.service";
import { ReactivateOrganizationUnitTypeUseCase } from "./application/use-cases/reactivate-organization-unit-type.use-case";
import { ReactivateOrganizationUnitUseCase } from "./application/use-cases/reactivate-organization-unit.use-case";
import { ReorderOrganizationUnitTypesUseCase } from "./application/use-cases/reorder-organization-unit-types.use-case";
import { UpdateOrganizationUnitTypeUseCase } from "./application/use-cases/update-organization-unit-type.use-case";
import { UpdateOrganizationUnitUseCase } from "./application/use-cases/update-organization-unit.use-case";
import { ORGANIZATION_REPOSITORY } from "./domain/ports/organization.repository.port";
import { ORGANIZATION_UNITS_REPOSITORY } from "./domain/ports/organization-units.repository.port";
import { PrismaOrganizationRepository } from "./infrastructure/persistence/prisma-organization.repository";
import { PrismaOrganizationUnitsRepository } from "./infrastructure/persistence/prisma-organization-units.repository";
import { OrganizationController } from "./presentation/controllers/organization.controller";
import { OrganizationUnitsController } from "./presentation/controllers/organization-units.controller";

@Module({
  imports: [AuditModule, TenantsModule],
  controllers: [OrganizationController, OrganizationUnitsController],
  providers: [
    CreateOrganizationRecordUseCase,
    ListOrganizationRecordsUseCase,
    GetOrganizationRecordUseCase,
    UpdateOrganizationRecordUseCase,
    ArchiveOrganizationRecordUseCase,
    ReactivateOrganizationRecordUseCase,
    OrganizationUnitsPolicyService,
    ListOrganizationUnitTypesUseCase,
    GetOrganizationUnitTypeUseCase,
    CreateOrganizationUnitTypeUseCase,
    UpdateOrganizationUnitTypeUseCase,
    ArchiveOrganizationUnitTypeUseCase,
    ReactivateOrganizationUnitTypeUseCase,
    DeleteOrganizationUnitTypeUseCase,
    ReorderOrganizationUnitTypesUseCase,
    ListOrganizationUnitsUseCase,
    GetOrganizationUnitUseCase,
    CreateOrganizationUnitUseCase,
    UpdateOrganizationUnitUseCase,
    ArchiveOrganizationUnitUseCase,
    ReactivateOrganizationUnitUseCase,
    DeleteOrganizationUnitUseCase,
    {
      provide: ORGANIZATION_REPOSITORY,
      useClass: PrismaOrganizationRepository
    },
    {
      provide: ORGANIZATION_UNITS_REPOSITORY,
      useClass: PrismaOrganizationUnitsRepository
    }
  ],
  exports: [ORGANIZATION_REPOSITORY, ORGANIZATION_UNITS_REPOSITORY]
})
export class OrganizationModule {}
