import { ConflictException } from "@nestjs/common";
import { ApproveCompanySignupRequestUseCase } from "../../application/use-cases/approve-company-signup-request.use-case";
import type { PrismaService } from "../../../../database/prisma/prisma.service";
import type { EventBus } from "../../../../events/event-bus.port";

const pendingRequest = {
  id: "request-1",
  companyName: "Acme Corp",
  desiredTenantSlug: "acme-demo",
  adminFirstName: "Ana",
  adminLastName: "Owner",
  adminEmail: "ana@example.com",
  companyWebsite: null,
  companySize: null,
  country: null,
  timezone: "America/La_Paz",
  preferredLanguage: "es",
  phone: null,
  message: null,
  status: "PENDING" as const,
  approvedTenantId: null,
  approvedTenant: null,
  reviewedByUserId: null,
  reviewedAt: null,
  rejectionReason: null,
  createdAt: new Date("2026-05-13T00:00:00.000Z"),
  updatedAt: new Date("2026-05-13T00:00:00.000Z")
};

const createEventBus = (): jest.Mocked<EventBus> => ({
  publish: jest.fn(),
  publishMany: jest.fn()
});

describe("ApproveCompanySignupRequestUseCase", () => {
  it("approves a pending request and provisions tenant owner access transactionally", async () => {
    const tx = {
      companySignupRequest: {
        findUnique: jest.fn().mockResolvedValueOnce(pendingRequest),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          ...pendingRequest,
          status: "APPROVED",
          approvedTenantId: "tenant-1",
          approvedTenant: {
            id: "tenant-1",
            name: "Acme Corp",
            slug: "acme-demo",
            status: "ACTIVE"
          },
          reviewedByUserId: "reviewer-1",
          reviewedAt: new Date("2026-05-14T00:00:00.000Z")
        })
      },
      tenant: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: "tenant-1" })
      },
      tenantProfile: {
        create: jest.fn().mockResolvedValue({ id: "profile-1" })
      },
      role: {
        upsert: jest.fn().mockResolvedValue({ id: "role-1" })
      },
      permission: {
        findMany: jest.fn().mockResolvedValue([{ id: "permission-1" }])
      },
      rolePermission: {
        createMany: jest.fn().mockResolvedValue({ count: 1 })
      },
      user: {
        upsert: jest.fn().mockResolvedValue({ id: "user-1" })
      },
      tenantMembership: {
        upsert: jest.fn().mockResolvedValue({ id: "membership-1" })
      },
      tenantMembershipRole: {
        upsert: jest.fn().mockResolvedValue({ membershipId: "membership-1", roleId: "role-1" })
      },
      auditEvent: {
        create: jest.fn().mockResolvedValue({ id: "audit-1" })
      }
    };
    const prisma = {
      $transaction: jest.fn(async (callback: (transaction: typeof tx) => unknown) => callback(tx))
    } as unknown as PrismaService;
    const eventBus = createEventBus();
    const useCase = new ApproveCompanySignupRequestUseCase(prisma, eventBus);

    const result = await useCase.execute({
      signupRequestId: "request-1",
      reviewedByUserId: "reviewer-1"
    });

    expect(tx.tenant.create).toHaveBeenCalledWith({
      data: {
        name: "Acme Corp",
        slug: "acme-demo",
        defaultLanguage: "es",
        timezone: "America/La_Paz"
      }
    });
    expect(tx.tenantProfile.create).toHaveBeenCalledWith({
      data: {
        tenantId: "tenant-1",
        website: null,
        companySize: null,
        country: null,
        phone: null,
        contactEmail: "ana@example.com"
      }
    });
    expect(tx.user.upsert).toHaveBeenCalledWith({
      where: { email: "ana@example.com" },
      update: { name: "Ana Owner" },
      create: {
        email: "ana@example.com",
        name: "Ana Owner",
        status: "INVITED"
      }
    });
    expect(tx.tenantMembership.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          tenantId: "tenant-1",
          userId: "user-1",
          roleId: "role-1",
          status: "ACTIVE"
        })
      })
    );
    expect(tx.tenantMembershipRole.upsert).toHaveBeenCalledWith({
      where: {
        membershipId_roleId: {
          membershipId: "membership-1",
          roleId: "role-1"
        }
      },
      update: {},
      create: {
        membershipId: "membership-1",
        roleId: "role-1"
      }
    });
    expect(tx.companySignupRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "request-1", status: "PENDING" },
        data: expect.objectContaining({
          status: "APPROVED",
          approvedTenantId: "tenant-1",
          reviewedByUserId: "reviewer-1"
        })
      })
    );
    expect(result.status).toBe("APPROVED");
    expect(result.approvedTenant?.status).toBe("ACTIVE");
    expect(eventBus.publishMany).toHaveBeenCalled();
  });

  it("rejects approving a request that is not pending", async () => {
    const tx = {
      companySignupRequest: {
        findUnique: jest.fn().mockResolvedValue({ ...pendingRequest, status: "APPROVED" })
      }
    };
    const prisma = {
      $transaction: jest.fn(async (callback: (transaction: typeof tx) => unknown) => callback(tx))
    } as unknown as PrismaService;
    const useCase = new ApproveCompanySignupRequestUseCase(prisma, createEventBus());

    await expect(
      useCase.execute({
        signupRequestId: "request-1",
        reviewedByUserId: "reviewer-1"
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("falls back to the product default when approving a legacy request with unsupported timezone", async () => {
    const tx = {
      companySignupRequest: {
        findUnique: jest.fn().mockResolvedValueOnce({ ...pendingRequest, timezone: "Europe/Madrid" }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          ...pendingRequest,
          timezone: "Europe/Madrid",
          status: "APPROVED",
          approvedTenantId: "tenant-1",
          approvedTenant: {
            id: "tenant-1",
            name: "Acme Corp",
            slug: "acme-demo",
            status: "ACTIVE"
          },
          reviewedByUserId: "reviewer-1",
          reviewedAt: new Date("2026-05-14T00:00:00.000Z")
        })
      },
      tenant: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: "tenant-1" })
      },
      tenantProfile: {
        create: jest.fn().mockResolvedValue({ id: "profile-1" })
      },
      role: {
        upsert: jest.fn().mockResolvedValue({ id: "role-1" })
      },
      permission: {
        findMany: jest.fn().mockResolvedValue([])
      },
      rolePermission: {
        createMany: jest.fn()
      },
      user: {
        upsert: jest.fn().mockResolvedValue({ id: "user-1" })
      },
      tenantMembership: {
        upsert: jest.fn().mockResolvedValue({ id: "membership-1" })
      },
      tenantMembershipRole: {
        upsert: jest.fn().mockResolvedValue({ membershipId: "membership-1", roleId: "role-1" })
      },
      auditEvent: {
        create: jest.fn().mockResolvedValue({ id: "audit-1" })
      }
    };
    const prisma = {
      $transaction: jest.fn(async (callback: (transaction: typeof tx) => unknown) => callback(tx))
    } as unknown as PrismaService;
    const useCase = new ApproveCompanySignupRequestUseCase(prisma, createEventBus());

    await useCase.execute({
      signupRequestId: "request-1",
      reviewedByUserId: "reviewer-1"
    });

    expect(tx.tenant.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          timezone: "America/New_York"
        })
      })
    );
  });
});
