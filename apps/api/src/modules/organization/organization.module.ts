import { Module } from "@nestjs/common";
import { CreateOrganizationRecordUseCase } from "./application/use-cases/create-organization-record.use-case";
import { ListOrganizationRecordsUseCase } from "./application/use-cases/list-organization-records.use-case";
import { ORGANIZATION_REPOSITORY } from "./domain/ports/organization.repository.port";
import { PrismaOrganizationRepository } from "./infrastructure/persistence/prisma-organization.repository";
import { OrganizationController } from "./presentation/controllers/organization.controller";

@Module({
  controllers: [OrganizationController],
  providers: [
    CreateOrganizationRecordUseCase,
    ListOrganizationRecordsUseCase,
    {
      provide: ORGANIZATION_REPOSITORY,
      useClass: PrismaOrganizationRepository
    }
  ],
  exports: [ORGANIZATION_REPOSITORY]
})
export class OrganizationModule {}
