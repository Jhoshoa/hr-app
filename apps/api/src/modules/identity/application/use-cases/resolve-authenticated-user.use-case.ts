import { Inject, Injectable } from "@nestjs/common";
import type { AuthenticatedUserContext } from "../../../../common/types/request-context";
import type { ExternalAuthUser } from "../../domain/entities/external-auth-user.entity";
import { USERS_REPOSITORY, UsersRepository } from "../../domain/ports/users.repository.port";

@Injectable()
export class ResolveAuthenticatedUserUseCase {
  constructor(@Inject(USERS_REPOSITORY) private readonly usersRepository: UsersRepository) {}

  execute = async (externalUser: ExternalAuthUser): Promise<AuthenticatedUserContext> => {
    const existingUser = await this.usersRepository.findByExternalAuthId(
      externalUser.provider,
      externalUser.providerUserId
    );

    const user = existingUser ?? await this.usersRepository.createFromExternalUser(externalUser);

    return {
      id: user.id,
      email: user.email,
      externalAuthProvider: user.externalAuthProvider,
      externalAuthUserId: user.externalAuthUserId
    };
  };
}
