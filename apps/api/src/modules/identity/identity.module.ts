import { Module } from "@nestjs/common";
import { AUTH_PROVIDER } from "./domain/ports/auth-provider.port";
import { USERS_REPOSITORY } from "./domain/ports/users.repository.port";
import { ListUserTenantsUseCase } from "./application/use-cases/list-user-tenants.use-case";
import { ResolveAuthenticatedUserUseCase } from "./application/use-cases/resolve-authenticated-user.use-case";
import { ResolveTenantContextUseCase } from "./application/use-cases/resolve-tenant-context.use-case";
import { PrismaUsersRepository } from "./infrastructure/persistence/prisma-users.repository";
import { SupabaseAuthProvider } from "./infrastructure/providers/supabase-auth.provider";
import { MeController } from "./presentation/controllers/me.controller";

@Module({
  controllers: [MeController],
  providers: [
    ListUserTenantsUseCase,
    ResolveAuthenticatedUserUseCase,
    ResolveTenantContextUseCase,
    {
      provide: AUTH_PROVIDER,
      useClass: SupabaseAuthProvider
    },
    {
      provide: USERS_REPOSITORY,
      useClass: PrismaUsersRepository
    }
  ],
  exports: [
    AUTH_PROVIDER,
    USERS_REPOSITORY,
    ListUserTenantsUseCase,
    ResolveAuthenticatedUserUseCase,
    ResolveTenantContextUseCase
  ]
})
export class IdentityModule {}
