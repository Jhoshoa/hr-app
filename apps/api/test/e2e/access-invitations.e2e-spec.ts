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

describe("Access invitations API", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const testId = `access-invitations-e2e-${Date.now()}`;

  const authProvider: AuthProvider = {
    verifyAccessToken: jest.fn(async (token: string) => ({
      provider: "supabase",
      providerUserId: token,
      email: `${token}@example.com`,
      emailVerified: true,
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
      where: { slug: { in: [`${testId}-tenant`, `${testId}-expired`] } }
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            `${testId}-admin@example.com`,
            `${testId}-target@example.com`,
            `${testId}-cancel@example.com`,
            `${testId}-other@example.com`,
            `${testId}-expired-admin@example.com`,
            `${testId}-expired-target@example.com`
          ]
        }
      }
    });
    await app.close();
  });

  it("creates, lists, resends, cancels, and accepts tenant invitations", async () => {
    const usersRead = await upsertPermission("users.read", "Users", "Read");
    const usersManage = await upsertPermission("users.manage", "Users", "Manage");
    const tenantRead = await upsertPermission("tenant.read", "Tenant", "Read");
    const tenant = await prisma.tenant.create({
      data: { name: `${testId} Tenant`, slug: `${testId}-tenant` }
    });
    const adminRole = await prisma.role.create({
      data: {
        tenantId: tenant.id,
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
        tenantId: tenant.id,
        key: "employee",
        name: "Employee",
        permissions: {
          create: {
            permissionId: tenantRead.id
          }
        }
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
    await prisma.tenantMembership.create({
      data: {
        tenantId: tenant.id,
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

    const createResponse = await request(app.getHttpServer())
      .post("/api/v1/tenant-invitations")
      .set("Authorization", `Bearer ${testId}-admin`)
      .set("x-tenant-slug", tenant.slug)
      .send({
        email: `${testId}-target@example.com`,
        roleIds: [employeeRole.id]
      })
      .expect(201);

    const invitationId = createResponse.body.id as string;
    const token = createResponse.body.acceptanceToken as string;
    expect(token).toHaveLength(43);
    expect(createResponse.body.email).toBe(`${testId}-target@example.com`);
    expect(createResponse.body.status).toBe("PENDING");
    expect(createResponse.body.roles).toEqual([
      expect.objectContaining({ key: "employee" })
    ]);

    await request(app.getHttpServer())
      .get("/api/v1/tenant-invitations/preview")
      .query({ token })
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual(
          expect.objectContaining({
            tenantName: `${testId} Tenant`,
            invitedEmail: `${testId}-target@example.com`,
            status: "PENDING",
            expiresAt: expect.any(String),
            roles: [{ name: "Employee" }]
          })
        );
        expect(response.body.id).toBeUndefined();
        expect(response.body.tokenHash).toBeUndefined();
      });

    const storedInvitation = await prisma.tenantInvitation.findUniqueOrThrow({
      where: { id: invitationId }
    });
    expect(storedInvitation.tokenHash).not.toBe(token);
    expect(storedInvitation.resendCount).toBe(0);
    expect(storedInvitation.lastSentAt).toBeInstanceOf(Date);

    const invitedMembership = await prisma.tenantMembership.findUniqueOrThrow({
      where: { id: storedInvitation.membershipId ?? "" },
      include: { roles: true }
    });
    expect(invitedMembership.status).toBe("INVITED");
    expect(invitedMembership.roles).toEqual([
      expect.objectContaining({ roleId: employeeRole.id })
    ]);

    const listResponse = await request(app.getHttpServer())
      .get("/api/v1/tenant-invitations")
      .set("Authorization", `Bearer ${testId}-admin`)
      .set("x-tenant-slug", tenant.slug)
      .expect(200);
    expect(listResponse.body.invitations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: invitationId,
          email: `${testId}-target@example.com`,
          status: "PENDING"
        })
      ])
    );

    const resendResponse = await request(app.getHttpServer())
      .post(`/api/v1/tenant-invitations/${invitationId}/resend`)
      .set("Authorization", `Bearer ${testId}-admin`)
      .set("x-tenant-slug", tenant.slug)
      .expect(201);
    const resentToken = resendResponse.body.acceptanceToken as string;
    expect(resentToken).not.toBe(token);
    expect(resendResponse.body.resendCount).toBe(1);
    expect(resendResponse.body.lastSentAt).toBeTruthy();

    const resentInvitation = await prisma.tenantInvitation.findUniqueOrThrow({
      where: { id: invitationId }
    });
    expect(resentInvitation.resendCount).toBe(1);
    expect(resentInvitation.tokenHash).not.toBe(storedInvitation.tokenHash);

    await request(app.getHttpServer())
      .post("/api/v1/tenant-invitations/accept")
      .set("Authorization", `Bearer ${testId}-target`)
      .send({ token })
      .expect(404);

    await request(app.getHttpServer())
      .post("/api/v1/tenant-invitations/accept")
      .set("Authorization", `Bearer ${testId}-other`)
      .send({ token: resentToken })
      .expect(409);

    await request(app.getHttpServer())
      .post("/api/v1/tenant-invitations/accept")
      .set("Authorization", `Bearer ${testId}-target`)
      .send({ token: resentToken })
      .expect(201)
      .expect((response) => {
        expect(response.body.status).toBe("ACCEPTED");
        expect(response.body.acceptanceToken).toBeUndefined();
      });

    const acceptedMembership = await prisma.tenantMembership.findUniqueOrThrow({
      where: { id: storedInvitation.membershipId ?? "" }
    });
    expect(acceptedMembership.status).toBe("ACTIVE");

    const cancelCreateResponse = await request(app.getHttpServer())
      .post("/api/v1/tenant-invitations")
      .set("Authorization", `Bearer ${testId}-admin`)
      .set("x-tenant-slug", tenant.slug)
      .send({
        email: `${testId}-cancel@example.com`,
        roleIds: [employeeRole.id]
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/tenant-invitations/${cancelCreateResponse.body.id}/cancel`)
      .set("Authorization", `Bearer ${testId}-admin`)
      .set("x-tenant-slug", tenant.slug)
      .expect(201)
      .expect((response) => {
        expect(response.body.status).toBe("CANCELLED");
      });

    const auditCount = await prisma.auditEvent.count({
      where: {
        tenantId: tenant.id,
        actorUserId: adminUser.id,
        resourceType: "TenantInvitation"
      }
    });
    expect(auditCount).toBeGreaterThanOrEqual(4);
  });

  it("marks expired invitations as EXPIRED when accepting after expiresAt", async () => {
    const usersRead = await upsertPermission("users.read", "Users", "Read");
    const usersManage = await upsertPermission("users.manage", "Users", "Manage");
    const tenantRead = await upsertPermission("tenant.read", "Tenant", "Read");
    const tenant = await prisma.tenant.create({
      data: { name: `${testId} Expired`, slug: `${testId}-expired` }
    });
    const adminRole = await prisma.role.create({
      data: {
        tenantId: tenant.id,
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
        tenantId: tenant.id,
        key: "employee",
        name: "Employee"
      }
    });
    const adminUser = await prisma.user.create({
      data: {
        email: `${testId}-expired-admin@example.com`,
        name: "Expired Admin",
        status: "ACTIVE",
        externalAuthProvider: "supabase",
        externalAuthUserId: `${testId}-expired-admin`
      }
    });
    await prisma.tenantMembership.create({
      data: {
        tenantId: tenant.id,
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
    const createResponse = await request(app.getHttpServer())
      .post("/api/v1/tenant-invitations")
      .set("Authorization", `Bearer ${testId}-expired-admin`)
      .set("x-tenant-slug", tenant.slug)
      .send({
        email: `${testId}-expired-target@example.com`,
        roleIds: [employeeRole.id]
      })
      .expect(201);
    const invitationId = createResponse.body.id as string;
    const token = createResponse.body.acceptanceToken as string;

    await prisma.tenantInvitation.update({
      data: {
        expiresAt: new Date(Date.now() - 60_000)
      },
      where: { id: invitationId }
    });

    await request(app.getHttpServer())
      .get("/api/v1/tenant-invitations/preview")
      .query({ token })
      .expect(200)
      .expect((response) => {
        expect(response.body.status).toBe("EXPIRED");
      });

    await request(app.getHttpServer())
      .post("/api/v1/tenant-invitations/accept")
      .set("Authorization", `Bearer ${testId}-expired-target`)
      .send({ token })
      .expect(409);

    const expiredInvitation = await prisma.tenantInvitation.findUniqueOrThrow({
      where: { id: invitationId }
    });
    expect(expiredInvitation.status).toBe("EXPIRED");
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
