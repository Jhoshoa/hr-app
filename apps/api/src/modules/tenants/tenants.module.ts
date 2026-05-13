import { Module } from "@nestjs/common";
import { TENANTS_REPOSITORY } from "./domain/ports/tenants.repository.port";
import { GetCurrentTenantUseCase } from "./application/use-cases/get-current-tenant.use-case";
import { UpdateCurrentTenantUseCase } from "./application/use-cases/update-current-tenant.use-case";
import { PrismaTenantsRepository } from "./infrastructure/persistence/prisma-tenants.repository";
import { TenantsController } from "./presentation/controllers/tenants.controller";

@Module({
  controllers: [TenantsController],
  providers: [
    GetCurrentTenantUseCase,
    UpdateCurrentTenantUseCase,
    {
      provide: TENANTS_REPOSITORY,
      useClass: PrismaTenantsRepository
    }
  ],
  exports: [TENANTS_REPOSITORY, GetCurrentTenantUseCase, UpdateCurrentTenantUseCase]
})
export class TenantsModule {}
