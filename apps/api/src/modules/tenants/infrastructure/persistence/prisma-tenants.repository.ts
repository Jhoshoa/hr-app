import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../database/prisma/prisma.service";
import type { TenantEntity } from "../../domain/entities/tenant.entity";
import type { TenantsRepository } from "../../domain/ports/tenants.repository.port";

@Injectable()
export class PrismaTenantsRepository implements TenantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById = async (tenantId: string): Promise<TenantEntity | null> => {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    return tenant;
  };

  findBySlug = async (slug: string): Promise<TenantEntity | null> => {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug }
    });

    return tenant;
  };
}
