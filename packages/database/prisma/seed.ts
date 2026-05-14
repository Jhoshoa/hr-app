/// <reference types="node" />

import { PrismaClient } from "@prisma/client";

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

const getBooleanEnv = (key: string): boolean => process.env[key] === "true";

const seed = async (): Promise<void> => {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "assuresoft-demo" },
    update: {},
    create: {
      name: "AssureSoft Demo",
      slug: "assuresoft-demo",
      defaultLanguage: "es",
      defaultCurrency: "BOB",
      timezone: "America/La_Paz"
    }
  });

  for (const [key, description] of permissions) {
    await prisma.permission.upsert({
      where: { key },
      update: { description },
      create: { key, description }
    });
  }

  const ownerRole = await prisma.role.upsert({
    where: { tenantId_key: { tenantId: tenant.id, key: "owner" } },
    update: {},
    create: {
      tenantId: tenant.id,
      key: "owner",
      name: "Owner",
      description: "Full tenant access",
      isSystemRole: true
    }
  });

  const allPermissions = await prisma.permission.findMany();

  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: ownerRole.id,
          permissionId: permission.id
        }
      },
      update: {},
      create: {
        roleId: ownerRole.id,
        permissionId: permission.id
      }
    });
  }

  await seedPlatformOwner(tenant.id, ownerRole.id);
};

const seedPlatformOwner = async (tenantId: string, ownerRoleId: string): Promise<void> => {
  const platformOwnerEmail = process.env.PLATFORM_OWNER_EMAIL?.trim();

  if (!platformOwnerEmail) {
    return;
  }

  const user = await prisma.user.upsert({
    where: { email: normalizeEmail(platformOwnerEmail) },
    update: {},
    create: {
      email: normalizeEmail(platformOwnerEmail),
      status: "INVITED"
    }
  });

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

  if (!getBooleanEnv("SEED_PLATFORM_OWNER_TENANT_MEMBERSHIP")) {
    return;
  }

  await prisma.tenantMembership.upsert({
    where: {
      tenantId_userId: {
        tenantId,
        userId: user.id
      }
    },
    update: {
      roleId: ownerRoleId,
      status: "ACTIVE",
      joinedAt: new Date()
    },
    create: {
      tenantId,
      userId: user.id,
      roleId: ownerRoleId,
      status: "ACTIVE",
      joinedAt: new Date()
    }
  });
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
