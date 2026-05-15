import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../database/prisma/prisma.service";
import type { PermissionEntity } from "../../domain/entities/permission.entity";
import type { PermissionsRepository } from "../../domain/ports/permissions.repository.port";

@Injectable()
export class PrismaPermissionsRepository implements PermissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  list = async (): Promise<PermissionEntity[]> =>
    this.prisma.permission.findMany({
      orderBy: [{ sortOrder: "asc" }, { key: "asc" }]
    });

  findIdsByTenantAssignableIds = async (permissionIds: readonly string[]): Promise<string[]> => {
    if (permissionIds.length === 0) {
      return [];
    }

    const permissions = await this.prisma.permission.findMany({
      select: { id: true },
      where: {
        id: {
          in: [...permissionIds]
        }
      }
    });

    return permissions.map((permission) => permission.id);
  };
}

