import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../../../common/decorators/current-user.decorator";
import { SkipTenant } from "../../../../common/decorators/skip-tenant.decorator";
import type { AuthenticatedUserContext } from "../../../../common/types/request-context";
import { ListUserTenantsUseCase } from "../../application/use-cases/list-user-tenants.use-case";

@ApiBearerAuth()
@ApiTags("identity")
@SkipTenant()
@Controller("me")
export class MeController {
  constructor(private readonly listUserTenantsUseCase: ListUserTenantsUseCase) {}

  @Get()
  async getMe(@CurrentUser() user: AuthenticatedUserContext) {
    const tenants = await this.listUserTenantsUseCase.execute(user.id);

    return {
      user,
      tenants
    };
  }
}
