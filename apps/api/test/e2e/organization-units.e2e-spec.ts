import "reflect-metadata";
import { INestApplication, ValidationPipe, VersioningType } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/database/prisma/prisma.service";
import { AUTH_PROVIDER, type AuthProvider } from "../../src/modules/identity/domain/ports/auth-provider.port";

describe("Organization units API", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const testId = `organization-units-e2e-${Date.now()}`;
  const token = `${testId}-admin`;

  const authProvider: AuthProvider = {
    verifyAccessToken: jest.fn(async (accessToken: string) => ({
      provider: "supabase",
      providerUserId: accessToken,
      email: `${accessToken}@example.com`,
      name: accessToken
    })),
    getExternalUser: jest.fn(),
    inviteUser: jest.fn(),
    disableUser: jest.fn()
  };

  const authed = (tenantSlug: string) => (agent: request.Test) =>
    agent.set("Authorization", `Bearer ${token}`).set("x-tenant-slug", tenantSlug);

  const upsertPermission = (key: string, module: string, action: string) =>
    prisma.permission.upsert({
      where: { key },
      update: { module, action },
      create: {
        key,
        description: `${action} ${module}`,
        module,
        action
      }
    });

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
        externalAuthUserId: token
      }
    });
    await app.close();
  });

  it("enforces tenant isolation, hierarchy validation, audit events, assignments, and employee filters", async () => {
    const [organizationRead, organizationManage, employeesRead, employeesManage] = await Promise.all([
      upsertPermission("organization.read", "Organization", "Read"),
      upsertPermission("organization.manage", "Organization", "Manage"),
      upsertPermission("employees.read", "Employees", "Read"),
      upsertPermission("employees.manage", "Employees", "Manage")
    ]);

    const tenantA = await prisma.tenant.create({
      data: { name: `${testId} A`, slug: `${testId}-a` }
    });
    const tenantB = await prisma.tenant.create({
      data: { name: `${testId} B`, slug: `${testId}-b` }
    });
    const roleA = await prisma.role.create({
      data: {
        tenantId: tenantA.id,
        key: "admin",
        name: "Admin"
      }
    });
    await prisma.rolePermission.createMany({
      data: [organizationRead, organizationManage, employeesRead, employeesManage].map((permission) => ({
        roleId: roleA.id,
        permissionId: permission.id
      }))
    });

    const user = await prisma.user.create({
      data: {
        email: `${token}@example.com`,
        name: "Admin User",
        status: "ACTIVE",
        externalAuthProvider: "supabase",
        externalAuthUserId: token
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

    const [locationA, locationB] = await Promise.all([
      prisma.location.create({
        data: {
          tenantId: tenantA.id,
          name: "New York HQ",
          country: "US",
          city: "New York",
          timezone: "America/New_York"
        }
      }),
      prisma.location.create({
        data: {
          tenantId: tenantB.id,
          name: "Austin HQ",
          country: "US",
          city: "Austin",
          timezone: "America/Chicago"
        }
      })
    ]);

    const typeResponse = await authed(tenantA.slug)(
      request(app.getHttpServer()).post("/api/v1/organization-unit-types")
    )
      .send({ key: "division", name: "Division", sortOrder: 10 })
      .expect(201);

    const typeId = typeResponse.body.id as string;

    await authed(tenantA.slug)(request(app.getHttpServer()).post("/api/v1/organization-units"))
      .send({
        typeId,
        primaryLocationId: locationB.id,
        name: "Wrong Tenant Location"
      })
      .expect(400);

    const parentResponse = await authed(tenantA.slug)(
      request(app.getHttpServer()).post("/api/v1/organization-units")
    )
      .send({
        typeId,
        primaryLocationId: locationA.id,
        key: "operations",
        name: "Operations",
        code: "OPS"
      })
      .expect(201);
    const parentId = parentResponse.body.id as string;

    const childResponse = await authed(tenantA.slug)(
      request(app.getHttpServer()).post("/api/v1/organization-units")
    )
      .send({
        typeId,
        parentOrganizationUnitId: parentId,
        key: "operations_east",
        name: "Operations East",
        code: "OPS-E"
      })
      .expect(201);
    const childId = childResponse.body.id as string;

    const listResponse = await authed(tenantA.slug)(
      request(app.getHttpServer()).get("/api/v1/organization-units")
    ).expect(200);
    expect(listResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: parentId, name: "Operations" }),
        expect.objectContaining({ id: childId, parentOrganizationUnitId: parentId })
      ])
    );

    const updateResponse = await authed(tenantA.slug)(
      request(app.getHttpServer()).patch(`/api/v1/organization-units/${childId}`)
    )
      .send({ name: "Operations Eastern" })
      .expect(200);
    expect(updateResponse.body.name).toBe("Operations Eastern");

    await authed(tenantA.slug)(request(app.getHttpServer()).post("/api/v1/organization-units"))
      .send({
        typeId,
        key: "operations_duplicate",
        name: "Operations Eastern"
      })
      .expect(409)
      .expect((response) => {
        expect(response.text).toContain("Organization unit name already exists");
      });

    await authed(tenantA.slug)(request(app.getHttpServer()).patch(`/api/v1/organization-units/${parentId}`))
      .send({ parentOrganizationUnitId: childId })
      .expect(400)
      .expect((response) => {
        expect(response.text).toContain("cycle");
      });

    await authed(tenantA.slug)(
      request(app.getHttpServer()).post(`/api/v1/organization-units/${parentId}/archive`)
    ).expect(409);

    const disposableResponse = await authed(tenantA.slug)(
      request(app.getHttpServer()).post("/api/v1/organization-units")
    )
      .send({ typeId, key: "temporary_team", name: "Temporary Team" })
      .expect(201);
    await authed(tenantA.slug)(
      request(app.getHttpServer()).post(`/api/v1/organization-units/${disposableResponse.body.id}/archive`)
    ).expect(201);
    await authed(tenantA.slug)(
      request(app.getHttpServer()).post(`/api/v1/organization-units/${disposableResponse.body.id}/reactivate`)
    ).expect(201);

    const tenantBType = await prisma.organizationUnitType.create({
      data: {
        tenantId: tenantB.id,
        key: "branch",
        name: "Branch"
      }
    });
    const tenantBUnit = await prisma.organizationUnit.create({
      data: {
        tenantId: tenantB.id,
        typeId: tenantBType.id,
        primaryLocationId: locationB.id,
        name: "Tenant B Branch"
      }
    });

    await authed(tenantA.slug)(
      request(app.getHttpServer()).get(`/api/v1/organization-units/${tenantBUnit.id}`)
    ).expect(404);
    await authed(tenantB.slug)(
      request(app.getHttpServer()).get(`/api/v1/organization-units/${tenantBUnit.id}`)
    ).expect(403);

    const [employeeA, employeeB] = await Promise.all([
      prisma.employee.create({
        data: {
          tenantId: tenantA.id,
          employeeNumber: "A-001",
          firstName: "Alex",
          lastName: "Adams",
          workEmail: `${testId}-alex@example.com`,
          startDate: new Date("2026-01-01T00:00:00.000Z")
        }
      }),
      prisma.employee.create({
        data: {
          tenantId: tenantA.id,
          employeeNumber: "A-002",
          firstName: "Blair",
          lastName: "Baker",
          workEmail: `${testId}-blair@example.com`,
          startDate: new Date("2026-01-01T00:00:00.000Z"),
          jobAssignments: {
            create: {
              tenantId: tenantA.id,
              organizationUnitId: disposableResponse.body.id,
              effectiveFrom: new Date("2026-01-01T00:00:00.000Z")
            }
          }
        }
      })
    ]);

    const assignmentResponse = await authed(tenantA.slug)(
      request(app.getHttpServer()).post(`/api/v1/employees/${employeeA.id}/job-assignments`)
    )
      .send({
        organizationUnitId: childId,
        effectiveFrom: "2026-02-01T00:00:00.000Z"
      })
      .expect(201);
    expect(assignmentResponse.body.organizationUnitId).toBe(childId);

    const filteredEmployeesResponse = await authed(tenantA.slug)(
      request(app.getHttpServer()).get(`/api/v1/employees?organizationUnitId=${childId}`)
    ).expect(200);
    expect(filteredEmployeesResponse.body.map((employee: { id: string }) => employee.id)).toEqual([
      employeeA.id
    ]);
    expect(filteredEmployeesResponse.body.map((employee: { id: string }) => employee.id)).not.toContain(
      employeeB.id
    );

    await authed(tenantA.slug)(
      request(app.getHttpServer()).post(`/api/v1/organization-units/${childId}/archive`)
    ).expect(409);

    const auditEvents = await prisma.auditEvent.findMany({
      where: {
        tenantId: tenantA.id,
        action: {
          in: [
            "organization_unit_type.created",
            "organization_unit.created",
            "organization_unit.updated",
            "organization_unit.archived",
            "organization_unit.reactivated",
            "employee.job_assignment.created",
            "employee.job_assignment.organization_unit_set"
          ]
        }
      }
    });
    expect(auditEvents.map((event) => event.action)).toEqual(
      expect.arrayContaining([
        "organization_unit_type.created",
        "organization_unit.created",
        "organization_unit.updated",
        "organization_unit.archived",
        "organization_unit.reactivated",
        "employee.job_assignment.created",
        "employee.job_assignment.organization_unit_set"
      ])
    );
  });
});
