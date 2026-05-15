import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AccessPolicyService } from "./application/services/access-policy.service";
import { InvitationTokenService } from "./application/services/invitation-token.service";
import { PermissionValidationService } from "./application/services/permission-validation.service";
import { AcceptTenantInvitationUseCase } from "./application/use-cases/accept-tenant-invitation.use-case";
import { ArchiveRoleUseCase } from "./application/use-cases/archive-role.use-case";
import { CancelTenantInvitationUseCase } from "./application/use-cases/cancel-tenant-invitation.use-case";
import { CreateRoleUseCase } from "./application/use-cases/create-role.use-case";
import { CreateTenantInvitationUseCase } from "./application/use-cases/create-tenant-invitation.use-case";
import { DisableTenantMembershipUseCase } from "./application/use-cases/disable-tenant-membership.use-case";
import { GetRoleUseCase } from "./application/use-cases/get-role.use-case";
import { GetTenantUserUseCase } from "./application/use-cases/get-tenant-user.use-case";
import { ListPermissionsUseCase } from "./application/use-cases/list-permissions.use-case";
import { ListRolesUseCase } from "./application/use-cases/list-roles.use-case";
import { ListTenantInvitationsUseCase } from "./application/use-cases/list-tenant-invitations.use-case";
import { ListTenantUsersUseCase } from "./application/use-cases/list-tenant-users.use-case";
import { ReactivateRoleUseCase } from "./application/use-cases/reactivate-role.use-case";
import { ReactivateTenantMembershipUseCase } from "./application/use-cases/reactivate-tenant-membership.use-case";
import { ResendTenantInvitationUseCase } from "./application/use-cases/resend-tenant-invitation.use-case";
import { UpdateTenantUserRolesUseCase } from "./application/use-cases/update-tenant-user-roles.use-case";
import { UpdateRolePermissionsUseCase } from "./application/use-cases/update-role-permissions.use-case";
import { UpdateRoleUseCase } from "./application/use-cases/update-role.use-case";
import { PERMISSIONS_REPOSITORY } from "./domain/ports/permissions.repository.port";
import { ROLES_REPOSITORY } from "./domain/ports/roles.repository.port";
import { TENANT_INVITATIONS_REPOSITORY } from "./domain/ports/tenant-invitations.repository.port";
import { TENANT_USERS_REPOSITORY } from "./domain/ports/tenant-users.repository.port";
import { PrismaPermissionsRepository } from "./infrastructure/persistence/prisma-permissions.repository";
import { PrismaRolesRepository } from "./infrastructure/persistence/prisma-roles.repository";
import { PrismaTenantInvitationsRepository } from "./infrastructure/persistence/prisma-tenant-invitations.repository";
import { PrismaTenantUsersRepository } from "./infrastructure/persistence/prisma-tenant-users.repository";
import { PermissionsController } from "./presentation/controllers/permissions.controller";
import { RolesController } from "./presentation/controllers/roles.controller";
import { TenantInvitationsController } from "./presentation/controllers/tenant-invitations.controller";
import { TenantUsersController } from "./presentation/controllers/tenant-users.controller";

@Module({
  imports: [AuditModule],
  controllers: [
    PermissionsController,
    RolesController,
    TenantUsersController,
    TenantInvitationsController
  ],
  providers: [
    AccessPolicyService,
    InvitationTokenService,
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
    ListTenantInvitationsUseCase,
    CreateTenantInvitationUseCase,
    ResendTenantInvitationUseCase,
    CancelTenantInvitationUseCase,
    AcceptTenantInvitationUseCase,
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
    },
    {
      provide: TENANT_INVITATIONS_REPOSITORY,
      useClass: PrismaTenantInvitationsRepository
    }
  ]
})
export class AccessModule {}
