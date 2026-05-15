import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Permissions } from "../../../../common/decorators/permissions.decorator";
import { ListPermissionsUseCase } from "../../application/use-cases/list-permissions.use-case";

@ApiBearerAuth()
@ApiTags("access")
@Controller("permissions")
export class PermissionsController {
  constructor(private readonly listPermissionsUseCase: ListPermissionsUseCase) {}

  @Get()
  @Permissions("roles.manage")
  async listPermissions() {
    const permissions = await this.listPermissionsUseCase.execute();

    return { permissions };
  }
}

