import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import {
  PERMISSIONS_REPOSITORY,
  type PermissionsRepository
} from "../../domain/ports/permissions.repository.port";

@Injectable()
export class PermissionValidationService {
  constructor(
    @Inject(PERMISSIONS_REPOSITORY)
    private readonly permissionsRepository: PermissionsRepository
  ) {}

  assertPermissionIdsExist = async (permissionIds: readonly string[]): Promise<void> => {
    const uniquePermissionIds = [...new Set(permissionIds)];
    const existingPermissionIds = await this.permissionsRepository.findIdsByTenantAssignableIds(
      uniquePermissionIds
    );

    if (existingPermissionIds.length !== uniquePermissionIds.length) {
      throw new BadRequestException("One or more permissions are invalid.");
    }
  };
}

