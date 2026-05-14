import { ConflictException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import type { AuthenticatedUserContext } from "../../../../common/types/request-context";
import type { ExternalAuthUser } from "../../domain/entities/external-auth-user.entity";
import { USERS_REPOSITORY } from "../../domain/ports/users.repository.port";
import type { UsersRepository } from "../../domain/ports/users.repository.port";

@Injectable()
export class ResolveAuthenticatedUserUseCase {
  constructor(
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
      if (!externalUser.emailVerified) {
        throw new UnauthorizedException("Verified email is required to claim pending access.");
      }

      return this.usersRepository.linkExternalAuthUser(existingEmailUser.id, externalUser);
    }

    throw new ConflictException("A user with this email is linked to another identity.");
  };
}
