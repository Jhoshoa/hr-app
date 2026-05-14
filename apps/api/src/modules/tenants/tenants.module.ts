import { Module } from "@nestjs/common";
import { ArchivePlatformTenantUseCase } from "./application/use-cases/archive-platform-tenant.use-case";
import { TENANTS_REPOSITORY } from "./domain/ports/tenants.repository.port";
import { GetCurrentTenantUseCase } from "./application/use-cases/get-current-tenant.use-case";
import { ReactivatePlatformTenantUseCase } from "./application/use-cases/reactivate-platform-tenant.use-case";
import { UpdateCurrentTenantUseCase } from "./application/use-cases/update-current-tenant.use-case";
import { PrismaTenantsRepository } from "./infrastructure/persistence/prisma-tenants.repository";
import { PlatformTenantsController } from "./presentation/controllers/platform-tenants.controller";
import { TenantsController } from "./presentation/controllers/tenants.controller";

@Module({
  controllers: [TenantsController, PlatformTenantsController],
  providers: [
    ArchivePlatformTenantUseCase,
    GetCurrentTenantUseCase,
    ReactivatePlatformTenantUseCase,
    UpdateCurrentTenantUseCase,
    {
      provide: TENANTS_REPOSITORY,
      useClass: PrismaTenantsRepository
    }
  ],
  exports: [TENANTS_REPOSITORY, GetCurrentTenantUseCase, UpdateCurrentTenantUseCase]
})
export class TenantsModule {}
