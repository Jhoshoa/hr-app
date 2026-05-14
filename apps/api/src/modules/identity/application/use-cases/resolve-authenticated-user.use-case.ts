import { ConflictException, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AuthenticatedUserContext } from "../../../../common/types/request-context";
import type { ExternalAuthUser } from "../../domain/entities/external-auth-user.entity";
import { USERS_REPOSITORY, UsersRepository } from "../../domain/ports/users.repository.port";

@Injectable()
export class ResolveAuthenticatedUserUseCase {
  constructor(
    private readonly configService: ConfigService,
    @Inject(USERS_REPOSITORY) private readonly usersRepository: UsersRepository
  ) {}

  execute = async (externalUser: ExternalAuthUser): Promise<AuthenticatedUserContext> => {
    const existingUser = await this.usersRepository.findByExternalAuthId(
      externalUser.provider,
      externalUser.providerUserId
    );

    const user = existingUser
      ? await this.usersRepository.syncExternalUserProfile(existingUser.id, externalUser)
      : await this.resolveByEmailOrCreate(externalUser);
    await this.ensureDevelopmentTenantMembership(user.id);
    const platformRoles = await this.usersRepository.findPlatformRolesByUserId(user.id);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      externalAuthProvider: externalUser.provider,
      externalAuthUserId: externalUser.providerUserId,
      platformRoles
    };
  };

  private resolveByEmailOrCreate = async (
    externalUser: ExternalAuthUser
  ) => {
    const existingEmailUser = await this.usersRepository.findByEmail(externalUser.email);

    if (!existingEmailUser) {
      return this.usersRepository.createFromExternalUser(externalUser);
    }

    if (!existingEmailUser.externalAuthProvider && !existingEmailUser.externalAuthUserId) {
      return this.usersRepository.linkExternalAuthUser(existingEmailUser.id, externalUser);
    }

    throw new ConflictException("A user with this email is linked to another identity.");
  };

  private ensureDevelopmentTenantMembership = async (userId: string): Promise<void> => {
    const nodeEnv = this.configService.get<string>("app.nodeEnv");
    const autoJoinDefaultTenant = this.configService.get<boolean>("app.autoJoinDefaultTenant");

    if (nodeEnv !== "development" || !autoJoinDefaultTenant) {
      return;
    }

    await this.usersRepository.ensureDevelopmentTenantMembership(
      userId,
      this.configService.getOrThrow<string>("app.defaultTenantSlug"),
      this.configService.getOrThrow<string>("app.defaultTenantRole")
    );
  };
}
