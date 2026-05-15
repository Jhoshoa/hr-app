import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AccessPolicyService } from "./application/services/access-policy.service";
import { PermissionValidationService } from "./application/services/permission-validation.service";
import { ArchiveRoleUseCase } from "./application/use-cases/archive-role.use-case";
import { CreateRoleUseCase } from "./application/use-cases/create-role.use-case";
import { DisableTenantMembershipUseCase } from "./application/use-cases/disable-tenant-membership.use-case";
import { GetRoleUseCase } from "./application/use-cases/get-role.use-case";
import { GetTenantUserUseCase } from "./application/use-cases/get-tenant-user.use-case";
import { ListPermissionsUseCase } from "./application/use-cases/list-permissions.use-case";
import { ListRolesUseCase } from "./application/use-cases/list-roles.use-case";
import { ListTenantUsersUseCase } from "./application/use-cases/list-tenant-users.use-case";
import { ReactivateRoleUseCase } from "./application/use-cases/reactivate-role.use-case";
import { ReactivateTenantMembershipUseCase } from "./application/use-cases/reactivate-tenant-membership.use-case";
import { UpdateTenantUserRolesUseCase } from "./application/use-cases/update-tenant-user-roles.use-case";
import { UpdateRolePermissionsUseCase } from "./application/use-cases/update-role-permissions.use-case";
import { UpdateRoleUseCase } from "./application/use-cases/update-role.use-case";
import { PERMISSIONS_REPOSITORY } from "./domain/ports/permissions.repository.port";
import { ROLES_REPOSITORY } from "./domain/ports/roles.repository.port";
import { TENANT_USERS_REPOSITORY } from "./domain/ports/tenant-users.repository.port";
import { PrismaPermissionsRepository } from "./infrastructure/persistence/prisma-permissions.repository";
import { PrismaRolesRepository } from "./infrastructure/persistence/prisma-roles.repository";
import { PrismaTenantUsersRepository } from "./infrastructure/persistence/prisma-tenant-users.repository";
import { PermissionsController } from "./presentation/controllers/permissions.controller";
import { RolesController } from "./presentation/controllers/roles.controller";
import { TenantUsersController } from "./presentation/controllers/tenant-users.controller";

@Module({
  imports: [AuditModule],
  controllers: [PermissionsController, RolesController, TenantUsersController],
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
    ListTenantUsersUseCase,
    GetTenantUserUseCase,
    UpdateTenantUserRolesUseCase,
    DisableTenantMembershipUseCase,
    ReactivateTenantMembershipUseCase,
    {
      provide: PERMISSIONS_REPOSITORY,
      useClass: PrismaPermissionsRepository
    },
    {
      provide: ROLES_REPOSITORY,
      useClass: PrismaRolesRepository
    },
    {
      provide: TENANT_USERS_REPOSITORY,
      useClass: PrismaTenantUsersRepository
    }
  ]
})
export class AccessModule {}
