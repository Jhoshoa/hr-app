import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../../../database/prisma/prisma.service";
import type { TenantEntity, UpdateTenantSettingsInput } from "../../domain/entities/tenant.entity";
import type { TenantsRepository } from "../../domain/ports/tenants.repository.port";

type TenantWithProfile = Prisma.TenantGetPayload<{ include: { profile: true } }>;

@Injectable()
export class PrismaTenantsRepository implements TenantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById = async (tenantId: string): Promise<TenantEntity | null> => {
    const tenant = await this.prisma.tenant.findUnique({
      include: { profile: true },
      where: { id: tenantId }
    });

    return tenant ? this.toEntity(tenant) : null;
  };

  findBySlug = async (slug: string): Promise<TenantEntity | null> => {
    const tenant = await this.prisma.tenant.findUnique({
      include: { profile: true },
      where: { slug }
    });

    return tenant ? this.toEntity(tenant) : null;
  };

  updateSettings = async (input: UpdateTenantSettingsInput): Promise<TenantEntity> =>
    this.prisma.$transaction(async (tx) => {
      await tx.tenant.update({
        where: { id: input.tenantId },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.defaultLanguage !== undefined ? { defaultLanguage: input.defaultLanguage } : {}),
          ...(input.defaultCurrency !== undefined ? { defaultCurrency: input.defaultCurrency } : {}),
          ...(input.timezone !== undefined ? { timezone: input.timezone } : {})
        }
      });

      if (input.profile !== undefined) {
        await tx.tenantProfile.upsert({
          where: { tenantId: input.tenantId },
          update: {
            ...(input.profile.website !== undefined ? { website: input.profile.website } : {}),
            ...(input.profile.companySize !== undefined ? { companySize: input.profile.companySize } : {}),
            ...(input.profile.country !== undefined ? { country: input.profile.country } : {}),
            ...(input.profile.phone !== undefined ? { phone: input.profile.phone } : {})
          },
          create: {
            tenantId: input.tenantId,
            website: input.profile.website ?? null,
            companySize: input.profile.companySize ?? null,
            country: input.profile.country ?? null,
            phone: input.profile.phone ?? null,
            contactEmail: null
          }
        });
      }

      const tenant = await tx.tenant.findUniqueOrThrow({
        include: { profile: true },
        where: { id: input.tenantId }
      });

      return this.toEntity(tenant);
    });

  private toEntity = (tenant: TenantWithProfile): TenantEntity => ({
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status,
    defaultLanguage: tenant.defaultLanguage,
    defaultCurrency: tenant.defaultCurrency,
    timezone: tenant.timezone,
    profile: tenant.profile
      ? {
          website: tenant.profile.website,
          companySize: tenant.profile.companySize,
          country: tenant.profile.country,
          phone: tenant.profile.phone,
          contactEmail: tenant.profile.contactEmail
        }
      : null
  });
}
