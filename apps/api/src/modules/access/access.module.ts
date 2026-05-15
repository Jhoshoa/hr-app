import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AccessPolicyService } from "./application/services/access-policy.service";
import { PermissionValidationService } from "./application/services/permission-validation.service";
import { ArchiveRoleUseCase } from "./application/use-cases/archive-role.use-case";
import { CreateRoleUseCase } from "./application/use-cases/create-role.use-case";
import { GetRoleUseCase } from "./application/use-cases/get-role.use-case";
import { ListPermissionsUseCase } from "./application/use-cases/list-permissions.use-case";
import { ListRolesUseCase } from "./application/use-cases/list-roles.use-case";
import { ReactivateRoleUseCase } from "./application/use-cases/reactivate-role.use-case";
import { UpdateRolePermissionsUseCase } from "./application/use-cases/update-role-permissions.use-case";
import { UpdateRoleUseCase } from "./application/use-cases/update-role.use-case";
import { PERMISSIONS_REPOSITORY } from "./domain/ports/permissions.repository.port";
import { ROLES_REPOSITORY } from "./domain/ports/roles.repository.port";
import { PrismaPermissionsRepository } from "./infrastructure/persistence/prisma-permissions.repository";
import { PrismaRolesRepository } from "./infrastructure/persistence/prisma-roles.repository";
import { PermissionsController } from "./presentation/controllers/permissions.controller";
import { RolesController } from "./presentation/controllers/roles.controller";

@Module({
  imports: [AuditModule],
  controllers: [PermissionsController, RolesController],
  providers: [
    AccessPolicyService,
    PermissionValidationService,
    ListPermissionsUseCase,
    ListRolesUseCase,
    GetRoleUseCase,
    CreateRoleUseCase,
    UpdateRoleUseCase,
    UpdateRolePermissionsUseCase,
    ArchiveRoleUseCase,
    ReactivateRoleUseCase,
    {
      provide: PERMISSIONS_REPOSITORY,
      useClass: PrismaPermissionsRepository
    },
    {
      provide: ROLES_REPOSITORY,
      useClass: PrismaRolesRepository
    }
  ]
})
export class AccessModule {}

