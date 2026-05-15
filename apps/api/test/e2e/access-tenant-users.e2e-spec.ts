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

describe("Access tenant users API", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const testId = `access-users-e2e-${Date.now()}`;

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
        externalAuthUserId: {
          in: [`${testId}-admin`, `${testId}-target`]
        }
      }
    });
    await app.close();
  });

  it("lists users, replaces membership roles, disables/reactivates, and blocks cross-tenant access", async () => {
    const usersRead = await upsertPermission("users.read", "Users", "Read");
    const usersManage = await upsertPermission("users.manage", "Users", "Manage");
    const tenantRead = await upsertPermission("tenant.read", "Tenant", "Read");
    const teamRead = await upsertPermission("employees.team.read", "Employees", "Read team");
    const tenantA = await prisma.tenant.create({
      data: { name: `${testId} A`, slug: `${testId}-a` }
    });
    const tenantB = await prisma.tenant.create({
      data: { name: `${testId} B`, slug: `${testId}-b` }
    });
    const adminRole = await prisma.role.create({
      data: {
        tenantId: tenantA.id,
        key: "owner",
        name: "Owner",
        isSystemRole: true,
        permissions: {
          createMany: {
            data: [
              { permissionId: usersRead.id },
              { permissionId: usersManage.id },
              { permissionId: tenantRead.id }
            ]
          }
        }
      }
    });
    const employeeRole = await prisma.role.create({
      data: {
        tenantId: tenantA.id,
        key: "employee",
        name: "Employee",
        permissions: {
          create: {
            permissionId: tenantRead.id
          }
        }
      }
    });
    const managerRole = await prisma.role.create({
      data: {
        tenantId: tenantA.id,
        key: "manager",
        name: "Manager",
        permissions: {
          createMany: {
            data: [{ permissionId: tenantRead.id }, { permissionId: teamRead.id }]
          }
        }
      }
    });
    const tenantBRole = await prisma.role.create({
      data: {
        tenantId: tenantB.id,
        key: "employee",
        name: "Employee"
      }
    });
    const adminUser = await prisma.user.create({
      data: {
        email: `${testId}-admin@example.com`,
        name: "Access Admin",
        status: "ACTIVE",
        externalAuthProvider: "supabase",
        externalAuthUserId: `${testId}-admin`
      }
    });
    const adminMembership = await prisma.tenantMembership.create({
      data: {
        tenantId: tenantA.id,
        userId: adminUser.id,
        roleId: adminRole.id,
        status: "ACTIVE",
        joinedAt: new Date(),
        roles: {
          create: {
            roleId: adminRole.id
          }
        }
      }
    });
    const targetUser = await prisma.user.create({
      data: {
        email: `${testId}-target@example.com`,
        name: "Target User",
        status: "ACTIVE",
        externalAuthProvider: "supabase",
        externalAuthUserId: `${testId}-target`
      }
    });
    const targetMembership = await prisma.tenantMembership.create({
      data: {
        tenantId: tenantA.id,
        userId: targetUser.id,
        roleId: employeeRole.id,
        status: "ACTIVE",
        joinedAt: new Date(),
        roles: {
          create: {
            roleId: employeeRole.id
          }
        }
      }
    });
    const tenantBMembership = await prisma.tenantMembership.create({
      data: {
        tenantId: tenantB.id,
        userId: targetUser.id,
        roleId: tenantBRole.id,
        status: "ACTIVE",
        joinedAt: new Date(),
        roles: {
          create: {
            roleId: tenantBRole.id
          }
        }
      }
    });

    const listResponse = await request(app.getHttpServer())
      .get("/api/v1/tenant-users")
      .set("Authorization", `Bearer ${testId}-admin`)
      .set("x-tenant-slug", tenantA.slug)
      .expect(200);

    expect(listResponse.body.users).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          membershipId: targetMembership.id,
          email: `${testId}-target@example.com`,
          roles: [expect.objectContaining({ key: "employee" })],
          effectivePermissions: ["tenant.read"]
        })
      ])
    );

    const updateRolesResponse = await request(app.getHttpServer())
      .put(`/api/v1/tenant-users/${targetMembership.id}/roles`)
      .set("Authorization", `Bearer ${testId}-admin`)
      .set("x-tenant-slug", tenantA.slug)
      .send({ roleIds: [employeeRole.id, managerRole.id] })
      .expect(200);

    expect(updateRolesResponse.body.roles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "employee" }),
        expect.objectContaining({ key: "manager" })
      ])
    );
    expect(updateRolesResponse.body.effectivePermissions).toEqual([
      "employees.team.read",
      "tenant.read"
    ]);

    await request(app.getHttpServer())
      .put(`/api/v1/tenant-users/${adminMembership.id}/roles`)
      .set("Authorization", `Bearer ${testId}-admin`)
      .set("x-tenant-slug", tenantA.slug)
      .send({ roleIds: [employeeRole.id] })
      .expect(409);

    await request(app.getHttpServer())
      .post(`/api/v1/tenant-users/${adminMembership.id}/disable`)
      .set("Authorization", `Bearer ${testId}-admin`)
      .set("x-tenant-slug", tenantA.slug)
      .expect(409);

    await request(app.getHttpServer())
      .post(`/api/v1/tenant-users/${adminMembership.id}/reactivate`)
      .set("Authorization", `Bearer ${testId}-admin`)
      .set("x-tenant-slug", tenantA.slug)
      .expect(409);

    const adminMembershipAfterSelfAttempts = await prisma.tenantMembership.findUniqueOrThrow({
      where: { id: adminMembership.id },
      include: { roles: true }
    });

    expect(adminMembershipAfterSelfAttempts.status).toBe("ACTIVE");
    expect(adminMembershipAfterSelfAttempts.roleId).toBe(adminRole.id);
    expect(adminMembershipAfterSelfAttempts.roles).toEqual([
      expect.objectContaining({ roleId: adminRole.id })
    ]);

    await request(app.getHttpServer())
      .post(`/api/v1/tenant-users/${targetMembership.id}/disable`)
      .set("Authorization", `Bearer ${testId}-admin`)
      .set("x-tenant-slug", tenantA.slug)
      .expect(201)
      .expect((response) => {
        expect(response.body.membershipStatus).toBe("DISABLED");
      });

    await request(app.getHttpServer())
      .post(`/api/v1/tenant-users/${targetMembership.id}/reactivate`)
      .set("Authorization", `Bearer ${testId}-admin`)
      .set("x-tenant-slug", tenantA.slug)
      .expect(201)
      .expect((response) => {
        expect(response.body.membershipStatus).toBe("ACTIVE");
      });

    await request(app.getHttpServer())
      .get(`/api/v1/tenant-users/${tenantBMembership.id}`)
      .set("Authorization", `Bearer ${testId}-admin`)
      .set("x-tenant-slug", tenantA.slug)
      .expect(404);

    const legacyMembership = await prisma.tenantMembership.findUniqueOrThrow({
      where: { id: targetMembership.id }
    });

    expect(legacyMembership.roleId).toBe(employeeRole.id);

    const auditCount = await prisma.auditEvent.count({
      where: {
        tenantId: tenantA.id,
        actorUserId: adminUser.id,
        resourceId: targetMembership.id
      }
    });

    expect(auditCount).toBeGreaterThanOrEqual(3);
  });

  const upsertPermission = async (key: string, module: string, action: string) =>
    prisma.permission.upsert({
      where: { key },
      update: {
        description: key,
        module,
        action
      },
      create: {
        key,
        description: key,
        module,
        action
      }
    });
});
