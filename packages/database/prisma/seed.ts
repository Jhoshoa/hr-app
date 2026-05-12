import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const permissions = [
  ["tenant.read", "Read tenant information"],
  ["tenant.manage", "Manage tenant settings"],
  ["users.read", "Read users"],
  ["users.manage", "Manage users and invitations"],
  ["roles.manage", "Manage roles and permissions"],
  ["audit.read", "Read audit events"]
] as const;

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
