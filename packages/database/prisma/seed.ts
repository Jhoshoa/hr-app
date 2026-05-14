/// <reference types="node" />

import { PrismaClient, type Role, type Tenant, type User } from "@prisma/client";
import { devSeedUsers } from "./dev-seed-data";

const prisma = new PrismaClient();

const permissions = [
  ["tenant.read", "Read tenant information"],
  ["tenant.manage", "Manage tenant settings"],
  ["users.read", "Read users"],
  ["users.manage", "Manage users and invitations"],
  ["roles.manage", "Manage roles and permissions"],
  ["audit.read", "Read audit events"],
  ["organization.read", "Read organization setup records"],
  ["organization.manage", "Manage organization setup records"],
  ["employees.read", "Read employee directory and profiles"],
  ["employees.self.read", "Read own employee profile"],
  ["employees.team.read", "Read direct report employee profiles"],
  ["employees.manage", "Manage employee profiles and job data"],
  ["employees.compensation.read", "Read employee compensation records"],
  ["employees.compensation.manage", "Manage employee compensation records"],
  ["employees.custom-fields.manage", "Manage employee custom field definitions"]
] as const;

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

  await seedTenantAdmin({
    tenantId: secondaryTenant.id,
    ownerRoleId: secondaryOwnerRole.id,
    email: devSeedUsers.secondaryTenantAdmin.email,
    name: devSeedUsers.secondaryTenantAdmin.name
  });

  await seedPendingCompanySignupRequest();
};

const seedPermissions = async (): Promise<void> => {
  for (const [key, description] of permissions) {
    await prisma.permission.upsert({
      where: { key },
      update: { description },
      create: { key, description }
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
      isSystemRole: true
    },
    create: {
      tenantId,
      key: "owner",
      name: "Owner",
      description: "Full tenant access",
      isSystemRole: true
    }
  });

const assignAllPermissions = async (roleId: string): Promise<void> => {
  const allPermissions = await prisma.permission.findMany();

  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId: permission.id
        }
      },
      update: {},
      create: {
        roleId,
        permissionId: permission.id
      }
    });
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

  await prisma.tenantMembership.upsert({
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
