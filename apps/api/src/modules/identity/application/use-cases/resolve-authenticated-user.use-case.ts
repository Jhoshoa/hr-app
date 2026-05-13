import { Inject, Injectable } from "@nestjs/common";
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

    const user = existingUser ?? await this.usersRepository.createFromExternalUser(externalUser);
    await this.ensureDevelopmentTenantMembership(user.id);

    return {
      id: user.id,
      email: user.email,
      externalAuthProvider: user.externalAuthProvider,
      externalAuthUserId: user.externalAuthUserId
    };
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
