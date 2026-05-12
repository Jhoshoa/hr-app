import "reflect-metadata";
import { INestApplication, ValidationPipe, VersioningType } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/database/prisma/prisma.service";
import { AUTH_PROVIDER, type AuthProvider } from "../../src/modules/identity/domain/ports/auth-provider.port";

describe("Employees API tenant isolation", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const testId = `employees-e2e-${Date.now()}`;

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
          in: [`${testId}-hr`, `${testId}-employee`]
        }
      }
    });
    await app.close();
  });

  it("blocks cross-tenant employee access and hides compensation without compensation permission", async () => {
    const permission = await prisma.permission.upsert({
      where: { key: "employees.read" },
      update: {},
      create: {
        key: "employees.read",
        description: "Read employee directory and profiles"
      }
    });

    const tenantA = await prisma.tenant.create({
      data: { name: `${testId} A`, slug: `${testId}-a` }
    });
    const tenantB = await prisma.tenant.create({
      data: { name: `${testId} B`, slug: `${testId}-b` }
    });
    const roleA = await prisma.role.create({
      data: {
        tenantId: tenantA.id,
        key: "hr",
        name: "HR"
      }
    });
    await prisma.rolePermission.create({
      data: {
        roleId: roleA.id,
        permissionId: permission.id
      }
    });

    const user = await prisma.user.create({
      data: {
        email: `${testId}-hr@example.com`,
        name: "HR User",
        status: "ACTIVE",
        externalAuthProvider: "supabase",
        externalAuthUserId: `${testId}-hr`
      }
    });
    await prisma.tenantMembership.create({
      data: {
        tenantId: tenantA.id,
        userId: user.id,
        roleId: roleA.id,
        status: "ACTIVE",
        joinedAt: new Date()
      }
    });

    const employeeA = await prisma.employee.create({
      data: {
        tenantId: tenantA.id,
        employeeNumber: "A-001",
        firstName: "Tenant",
        lastName: "A",
        workEmail: `${testId}-a@example.com`,
        startDate: new Date("2026-05-12T00:00:00.000Z"),
        compensation: {
          create: {
            tenantId: tenantA.id,
            amount: "10000",
            currency: "BOB",
            frequency: "MONTHLY",
            visibility: "HR_ONLY",
            effectiveFrom: new Date("2026-05-12T00:00:00.000Z")
          }
        }
      }
    });
    const employeeB = await prisma.employee.create({
      data: {
        tenantId: tenantB.id,
        employeeNumber: "B-001",
        firstName: "Tenant",
        lastName: "B",
        workEmail: `${testId}-b@example.com`,
        startDate: new Date("2026-05-12T00:00:00.000Z")
      }
    });

    const ownTenantResponse = await request(app.getHttpServer())
      .get(`/api/v1/employees/${employeeA.id}`)
      .set("Authorization", `Bearer ${testId}-hr`)
      .set("x-tenant-slug", tenantA.slug)
      .expect(200);

    expect(ownTenantResponse.body.id).toBe(employeeA.id);
    expect(ownTenantResponse.body.compensation).toBeUndefined();

    await request(app.getHttpServer())
      .get(`/api/v1/employees/${employeeB.id}`)
      .set("Authorization", `Bearer ${testId}-hr`)
      .set("x-tenant-slug", tenantA.slug)
      .expect(404);

    await request(app.getHttpServer())
      .get(`/api/v1/employees/${employeeB.id}`)
      .set("Authorization", `Bearer ${testId}-hr`)
      .set("x-tenant-slug", tenantB.slug)
      .expect(403);
  });
});
