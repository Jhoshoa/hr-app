import "reflect-metadata";
import { INestApplication, ValidationPipe, VersioningType } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/database/prisma/prisma.service";
import {
  AUTH_PROVIDER,
  type AuthProvider
} from "../../src/modules/identity/domain/ports/auth-provider.port";

describe("Access roles API", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const testId = `access-roles-e2e-${Date.now()}`;

  const authProvider: AuthProvider = {
    verifyAccessToken: jest.fn(async (token: string) => ({
      provider: "supabase",
      providerUserId: token,
      email: `${token}@example.com`,
      name: token
    })),
    getExternalUser: jest.fn(),
    inviteUser: jest.fn(),
    disableUser: jest.fn()
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(AUTH_PROVIDER)
      .useValue(authProvider)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: "1"
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
      })
    );

    prisma = app.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await prisma.tenant.deleteMany({
      where: {
        slug: {
          in: [`${testId}-a`, `${testId}-b`]
        }
      }
    });
    await prisma.user.deleteMany({
      where: {
        externalAuthUserId: testId
      }
    });
    await app.close();
  });

  it("manages tenant roles and blocks cross-tenant role access", async () => {
    const rolesManagePermission = await prisma.permission.upsert({
      where: { key: "roles.manage" },
      update: {
        description: "Manage roles and permissions",
        module: "Roles",
        action: "Manage",
        sortOrder: 50,
        isCritical: true
      },
      create: {
        key: "roles.manage",
        description: "Manage roles and permissions",
        module: "Roles",
        action: "Manage",
        sortOrder: 50,
        isCritical: true
      }
    });
    const tenantReadPermission = await prisma.permission.upsert({
      where: { key: "tenant.read" },
      update: {
        description: "Read tenant information",
        module: "Tenant",
        action: "Read",
        sortOrder: 10
      },
      create: {
        key: "tenant.read",
        description: "Read tenant information",
        module: "Tenant",
        action: "Read",
        sortOrder: 10
      }
    });
    const tenantA = await prisma.tenant.create({
      data: { name: `${testId} A`, slug: `${testId}-a` }
    });
    const tenantB = await prisma.tenant.create({
      data: { name: `${testId} B`, slug: `${testId}-b` }
    });
    const ownerRole = await prisma.role.create({
      data: {
        tenantId: tenantA.id,
        key: "owner",
        name: "Owner",
        isSystemRole: true,
        permissions: {
          create: {
            permissionId: rolesManagePermission.id
          }
        }
      }
    });
    const systemRole = await prisma.role.create({
      data: {
        tenantId: tenantA.id,
        key: "hr_admin",
        name: "HR Admin",
        isSystemRole: true,
        permissions: {
          create: {
            permissionId: tenantReadPermission.id
          }
        }
      }
    });
    const archivedSystemRole = await prisma.role.create({
      data: {
        tenantId: tenantA.id,
        key: "manager",
        name: "Manager",
        isSystemRole: true,
        status: "ARCHIVED"
      }
    });
    const tenantBRole = await prisma.role.create({
      data: {
        tenantId: tenantB.id,
        key: "external",
        name: "External"
      }
    });
    const user = await prisma.user.create({
      data: {
        email: `${testId}@example.com`,
        name: "Access Admin",
        status: "ACTIVE",
        externalAuthProvider: "supabase",
        externalAuthUserId: testId
      }
    });
    const membership = await prisma.tenantMembership.create({
      data: {
        tenantId: tenantA.id,
        userId: user.id,
        roleId: ownerRole.id,
        status: "ACTIVE",
        joinedAt: new Date(),
        roles: {
          create: {
            roleId: ownerRole.id
          }
        }
      }
    });

    const createResponse = await request(app.getHttpServer())
      .post("/api/v1/roles")
      .set("Authorization", `Bearer ${testId}`)
      .set("x-tenant-slug", tenantA.slug)
      .send({
        key: "Payroll Reviewer",
        name: "Payroll Reviewer",
        description: "Reviews payroll data",
        permissionIds: [tenantReadPermission.id]
      })
      .expect(201);

    expect(createResponse.body.key).toBe("payroll_reviewer");
    expect(createResponse.body.permissions).toHaveLength(1);

    const roleId = createResponse.body.id as string;
    const listResponse = await request(app.getHttpServer())
      .get("/api/v1/roles")
      .set("Authorization", `Bearer ${testId}`)
      .set("x-tenant-slug", tenantA.slug)
      .expect(200);

    expect(listResponse.body.roles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: roleId,
          key: "payroll_reviewer",
          permissionCount: 1
        })
      ])
    );

    await request(app.getHttpServer())
      .put(`/api/v1/roles/${roleId}/permissions`)
      .set("Authorization", `Bearer ${testId}`)
      .set("x-tenant-slug", tenantA.slug)
      .send({ permissionIds: [] })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/roles/${systemRole.id}`)
      .set("Authorization", `Bearer ${testId}`)
      .set("x-tenant-slug", tenantA.slug)
      .send({ name: "Edited HR Admin" })
      .expect(409);

    await request(app.getHttpServer())
      .put(`/api/v1/roles/${systemRole.id}/permissions`)
      .set("Authorization", `Bearer ${testId}`)
      .set("x-tenant-slug", tenantA.slug)
      .send({ permissionIds: [] })
      .expect(409);

    await request(app.getHttpServer())
      .post(`/api/v1/roles/${systemRole.id}/archive`)
      .set("Authorization", `Bearer ${testId}`)
      .set("x-tenant-slug", tenantA.slug)
      .expect(409);

    await request(app.getHttpServer())
      .post(`/api/v1/roles/${archivedSystemRole.id}/reactivate`)
      .set("Authorization", `Bearer ${testId}`)
      .set("x-tenant-slug", tenantA.slug)
      .expect(409);

    const systemRolesAfterMutationAttempts = await prisma.role.findMany({
      where: {
        id: {
          in: [systemRole.id, archivedSystemRole.id]
        }
      },
      include: {
        permissions: true
      }
    });

    expect(systemRolesAfterMutationAttempts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: systemRole.id,
          name: "HR Admin",
          status: "ACTIVE",
          permissions: [expect.objectContaining({ permissionId: tenantReadPermission.id })]
        }),
        expect.objectContaining({
          id: archivedSystemRole.id,
          name: "Manager",
          status: "ARCHIVED"
        })
      ])
    );

    await request(app.getHttpServer())
      .post(`/api/v1/roles/${roleId}/archive`)
      .set("Authorization", `Bearer ${testId}`)
      .set("x-tenant-slug", tenantA.slug)
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/v1/roles/${tenantBRole.id}`)
      .set("Authorization", `Bearer ${testId}`)
      .set("x-tenant-slug", tenantA.slug)
      .expect(404);

    const auditCount = await prisma.auditEvent.count({
      where: {
        tenantId: tenantA.id,
        actorUserId: user.id,
        resourceId: roleId
      }
    });

    expect(auditCount).toBeGreaterThanOrEqual(3);
    expect(membership.id).toBeTruthy();
  });
});
