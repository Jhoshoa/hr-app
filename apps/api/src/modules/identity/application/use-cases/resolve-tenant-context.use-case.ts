import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import type { TenantContext } from "../../../../common/types/request-context";
import { USERS_REPOSITORY, UsersRepository } from "../../domain/ports/users.repository.port";

interface ResolveTenantContextInput {
  readonly userId: string;
  readonly tenantSlug: string;
}

@Injectable()
export class ResolveTenantContextUseCase {
  constructor(@Inject(USERS_REPOSITORY) private readonly usersRepository: UsersRepository) {}

  execute = async (input: ResolveTenantContextInput): Promise<TenantContext> => {
    const membership = await this.usersRepository.findTenantMembershipContext(
      input.userId,
      input.tenantSlug
    );

    if (!membership) {
      throw new ForbiddenException("User does not have access to this tenant.");
    }

    return {
      id: membership.tenantId,
      slug: membership.tenantSlug,
      name: membership.tenantName,
      roleKey: membership.roleKey,
      permissions: membership.permissions
    };
  };
}
