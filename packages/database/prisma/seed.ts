/// <reference types="node" />

import { PrismaClient, type Role, type Tenant, type User } from "@prisma/client";
import { permissionCatalog, type PermissionKey } from "../src/permission-catalog";
import { tenantFeatureCatalog, type TenantFeatureKey } from "../src/tenant-feature-catalog";
import { devSeedUsers } from "./dev-seed-data";

const prisma = new PrismaClient();

interface RoleTemplate {
  readonly key: string;
  readonly name: string;
  readonly description: string;
  readonly permissionKeys: readonly PermissionKey[];
}

const roleTemplates = [
  {
    key: "hr_admin",
    name: "HR Admin",
    description: "Administrative HR access for tenant operations.",
    permissionKeys: [
      "tenant.read",
      "users.read",
      "users.manage",
      "roles.manage",
      "organization.read",
      "organization.manage",
      "employees.read",
      "employees.manage",
      "employees.compensation.read",
      "employees.compensation.manage",
      "employees.custom-fields.manage",
      "audit.read"
    ]
  },
  {
    key: "hr_staff",
    name: "HR Staff",
    description: "Operational HR access without tenant access administration.",
    permissionKeys: [
      "tenant.read",
      "users.read",
      "organization.read",
      "employees.read",
      "employees.manage",
      "employees.custom-fields.manage"
    ]
  },
  {
    key: "manager",
    name: "Manager",
    description: "Manager access to employee directory and direct reports.",
    permissionKeys: ["tenant.read", "employees.read", "employees.team.read"]
  },
  {
    key: "employee",
    name: "Employee",
    description: "Basic employee self-service access.",
    permissionKeys: ["tenant.read", "employees.self.read"]
  },
  {
    key: "finance_viewer",
    name: "Finance Viewer",
    description: "Read-only employee compensation access.",
    permissionKeys: ["tenant.read", "employees.read", "employees.compensation.read"]
  },
  {
    key: "recruiter",
    name: "Recruiter",
    description: "Recruiting-oriented access to users and employee directory.",
    permissionKeys: ["tenant.read", "users.read", "employees.read"]
  }
] as const satisfies readonly RoleTemplate[];

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const seed = async (): Promise<void> => {
  await seedPermissions();

  const primaryTenant = await upsertTenant({
    name: "AssureSoft Demo",
    slug: "assuresoft-demo",
    defaultLanguage: "es",
    defaultCurrency: "BOB",
    timezone: "America/La_Paz"
  });
  const primaryOwnerRole = await upsertOwnerRole(primaryTenant.id);
  await assignAllPermissions(primaryOwnerRole.id);
  await seedRoleTemplates(primaryTenant.id);
  await seedTenantFeatures(primaryTenant.id, tenantFeatureCatalog);

  await seedPlatformOwner(devSeedUsers.platformOwner.email, devSeedUsers.platformOwner.name);
  await seedTenantAdmin({
    tenantId: primaryTenant.id,
    ownerRoleId: primaryOwnerRole.id,
    email: devSeedUsers.demoTenantAdmin.email,
    name: devSeedUsers.demoTenantAdmin.name
  });

  const secondaryTenant = await upsertTenant({
    name: "Secondary Demo",
    slug: "secondary-demo",
    defaultLanguage: "en",
    defaultCurrency: "USD",
    timezone: "America/New_York"
  });
  const secondaryOwnerRole = await upsertOwnerRole(secondaryTenant.id);
  await assignAllPermissions(secondaryOwnerRole.id);
  await seedRoleTemplates(secondaryTenant.id);
  await seedTenantFeatures(secondaryTenant.id, tenantFeatureCatalog);

  await seedTenantAdmin({
    tenantId: secondaryTenant.id,
    ownerRoleId: secondaryOwnerRole.id,
    email: devSeedUsers.secondaryTenantAdmin.email,
    name: devSeedUsers.secondaryTenantAdmin.name
  });

  await ensureLegacyMembershipRoles();
  await seedPendingCompanySignupRequest();
};

const seedPermissions = async (): Promise<void> => {
  for (const permission of permissionCatalog) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: {
        description: permission.description,
        module: permission.module,
        action: permission.action,
        sortOrder: permission.sortOrder,
        isCritical: permission.isCritical ?? false
      },
      create: {
        key: permission.key,
        description: permission.description,
        module: permission.module,
        action: permission.action,
        sortOrder: permission.sortOrder,
        isCritical: permission.isCritical ?? false
      }
    });
  }
};

interface TenantSeedInput {
  readonly name: string;
  readonly slug: string;
  readonly defaultLanguage: string;
  readonly defaultCurrency: string;
  readonly timezone: string;
}

const upsertTenant = async (input: TenantSeedInput): Promise<Tenant> =>
  prisma.tenant.upsert({
    where: { slug: input.slug },
    update: {
      name: input.name,
      defaultLanguage: input.defaultLanguage,
      defaultCurrency: input.defaultCurrency,
      timezone: input.timezone
    },
    create: input
  });

const upsertOwnerRole = async (tenantId: string): Promise<Role> =>
  prisma.role.upsert({
    where: { tenantId_key: { tenantId, key: "owner" } },
    update: {
      name: "Owner",
      description: "Full tenant access",
      isSystemRole: true,
      status: "ACTIVE"
    },
    create: {
      tenantId,
      key: "owner",
      name: "Owner",
      description: "Full tenant access",
      isSystemRole: true,
      status: "ACTIVE"
    }
  });

const assignAllPermissions = async (roleId: string): Promise<void> => {
  const allPermissions = await prisma.permission.findMany();

  await syncRolePermissions(
    roleId,
    allPermissions.map((permission) => permission.id)
  );
};

const syncRolePermissions = async (
  roleId: string,
  permissionIds: readonly string[]
): Promise<void> => {
  await prisma.rolePermission.deleteMany({
    where: {
      roleId,
      permissionId: {
        notIn: [...permissionIds]
      }
    }
  });

  for (const permissionId of permissionIds) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId
        }
      },
      update: {},
      create: {
        roleId,
        permissionId
      }
    });
  }
};

const seedRoleTemplates = async (tenantId: string): Promise<void> => {
  const permissions = await prisma.permission.findMany({
    where: {
      key: {
        in: roleTemplates.flatMap((template) => [...template.permissionKeys])
      }
    }
  });
  const permissionIdByKey = new Map(permissions.map((permission) => [permission.key, permission.id]));

  for (const template of roleTemplates) {
    const role = await prisma.role.upsert({
      where: {
        tenantId_key: {
          tenantId,
          key: template.key
        }
      },
      update: {
        name: template.name,
        description: template.description,
        isSystemRole: true,
        status: "ACTIVE"
      },
      create: {
        tenantId,
        key: template.key,
        name: template.name,
        description: template.description,
        isSystemRole: true,
        status: "ACTIVE"
      }
    });
    const permissionIds = template.permissionKeys.map((permissionKey) => {
      const permissionId = permissionIdByKey.get(permissionKey);

      if (!permissionId) {
        throw new Error(`Missing permission in catalog seed: ${permissionKey}`);
      }

      return permissionId;
    });

    await syncRolePermissions(role.id, permissionIds);
  }
};

const seedTenantFeatures = async (
  tenantId: string,
  featureKeys: readonly TenantFeatureKey[]
): Promise<void> => {
  for (const key of featureKeys) {
    await prisma.tenantFeature.upsert({
      where: {
        tenantId_key: {
          tenantId,
          key
        }
      },
      update: {
        enabled: true,
        source: "seed"
      },
      create: {
        tenantId,
        key,
        enabled: true,
        source: "seed"
      }
    });
  }
};

const assignMembershipRole = async (membershipId: string, roleId: string): Promise<void> => {
  await prisma.tenantMembershipRole.upsert({
    where: {
      membershipId_roleId: {
        membershipId,
        roleId
      }
    },
    update: {},
    create: {
      membershipId,
      roleId
    }
  });
};

const ensureLegacyMembershipRoles = async (): Promise<void> => {
  const memberships = await prisma.tenantMembership.findMany({
    select: {
      id: true,
      roleId: true
    }
  });

  for (const membership of memberships) {
    await assignMembershipRole(membership.id, membership.roleId);
  }
};

const upsertPendingUser = async (email: string, name?: string): Promise<User | null> => {
  if (!email) {
    return null;
  }

  return prisma.user.upsert({
    where: { email: normalizeEmail(email) },
    update: {
      name: name ?? undefined
    },
    create: {
      email: normalizeEmail(email),
      name,
      status: "INVITED"
    }
  });
};

const seedPlatformOwner = async (email: string, name: string): Promise<void> => {
  const user = await upsertPendingUser(email, name);

  if (!user) {
    return;
  }

  await prisma.platformUserRole.upsert({
    where: {
      userId_roleKey: {
        userId: user.id,
        roleKey: "PLATFORM_OWNER"
      }
    },
    update: {},
    create: {
      userId: user.id,
      roleKey: "PLATFORM_OWNER"
    }
  });
};

interface TenantAdminSeedInput {
  readonly tenantId: string;
  readonly ownerRoleId: string;
  readonly email: string;
  readonly name: string;
}

const seedTenantAdmin = async (input: TenantAdminSeedInput): Promise<void> => {
  const user = await upsertPendingUser(input.email, input.name);

  if (!user) {
    return;
  }

  const membership = await prisma.tenantMembership.upsert({
    where: {
      tenantId_userId: {
        tenantId: input.tenantId,
        userId: user.id
      }
    },
    update: {
      roleId: input.ownerRoleId,
      status: "ACTIVE",
      joinedAt: new Date()
    },
    create: {
      tenantId: input.tenantId,
      userId: user.id,
      roleId: input.ownerRoleId,
      status: "ACTIVE",
      joinedAt: new Date()
    }
  });

  await assignMembershipRole(membership.id, input.ownerRoleId);
};

const seedPendingCompanySignupRequest = async (): Promise<void> => {
  const adminEmail = normalizeEmail(devSeedUsers.pendingSignupAdmin.email);
  const desiredTenantSlug = "pending-demo";
  const existingRequest = await prisma.companySignupRequest.findFirst({
    where: {
      desiredTenantSlug,
      adminEmail
    }
  });
  const data = {
    companyName: "Pending Demo Company",
    desiredTenantSlug,
    adminFirstName: devSeedUsers.pendingSignupAdmin.firstName,
    adminLastName: devSeedUsers.pendingSignupAdmin.lastName,
    adminEmail,
    companyWebsite: "https://pending-demo.example.test",
    companySize: "11-50",
    country: "BO",
    timezone: "America/La_Paz",
    preferredLanguage: "es",
    phone: null,
    message: "Seeded local signup request for approval workflow testing.",
    status: "PENDING" as const
  };

  if (existingRequest) {
    await prisma.companySignupRequest.update({
      where: { id: existingRequest.id },
      data
    });
    return;
  }

  await prisma.companySignupRequest.create({ data });
};

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
