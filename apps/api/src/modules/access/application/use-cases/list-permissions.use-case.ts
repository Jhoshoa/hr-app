import { Inject, Injectable } from "@nestjs/common";
import type { PermissionEntity } from "../../domain/entities/permission.entity";
import {
  PERMISSIONS_REPOSITORY,
  type PermissionsRepository
} from "../../domain/ports/permissions.repository.port";

@Injectable()
export class ListPermissionsUseCase {
  constructor(
    @Inject(PERMISSIONS_REPOSITORY)
    private readonly permissionsRepository: PermissionsRepository
  ) {}

  execute = async (): Promise<PermissionEntity[]> => this.permissionsRepository.list();
}

