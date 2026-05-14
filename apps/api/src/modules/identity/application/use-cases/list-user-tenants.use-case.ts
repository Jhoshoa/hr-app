import { Inject, Injectable } from "@nestjs/common";
import { USERS_REPOSITORY } from "../../domain/ports/users.repository.port";
import type { UsersRepository } from "../../domain/ports/users.repository.port";
import type { TenantMembershipContext } from "../../domain/entities/tenant-membership.entity";

@Injectable()
export class ListUserTenantsUseCase {
  constructor(@Inject(USERS_REPOSITORY) private readonly usersRepository: UsersRepository) {}

  execute = async (userId: string): Promise<TenantMembershipContext[]> => {
    return this.usersRepository.findTenantMembershipsByUserId(userId);
  };
}
