import { ConflictException } from "@nestjs/common";
import { RejectCompanySignupRequestUseCase } from "../../application/use-cases/reject-company-signup-request.use-case";
import type { PrismaService } from "../../../../database/prisma/prisma.service";
import type { EventBus } from "../../../../events/event-bus.port";

const createEventBus = (): jest.Mocked<EventBus> => ({
  publish: jest.fn(),
  publishMany: jest.fn()
});

describe("RejectCompanySignupRequestUseCase", () => {
  it("rejects a pending request transactionally", async () => {
    const rejectedRequest = {
      id: "request-1",
      companyName: "Acme Corp",
      desiredTenantSlug: "acme-demo",
      adminFirstName: "Ana",
      adminLastName: "Owner",
      adminEmail: "ana@example.com",
      companyWebsite: null,
      companySize: null,
      country: null,
      timezone: null,
      preferredLanguage: "es",
      phone: null,
      message: null,
      status: "REJECTED" as const,
      approvedTenantId: null,
      approvedTenant: null,
      reviewedByUserId: "reviewer-1",
      reviewedAt: new Date("2026-05-14T00:00:00.000Z"),
      rejectionReason: "Not a fit right now",
      createdAt: new Date("2026-05-13T00:00:00.000Z"),
      updatedAt: new Date("2026-05-13T00:00:00.000Z")
    };
    const tx = {
      companySignupRequest: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue(rejectedRequest)
      },
      auditEvent: {
        create: jest.fn().mockResolvedValue({ id: "audit-1" })
      }
    };
    const prisma = {
      $transaction: jest.fn(async (callback: (transaction: typeof tx) => unknown) => callback(tx))
    } as unknown as PrismaService;
    const eventBus = createEventBus();
    const useCase = new RejectCompanySignupRequestUseCase(prisma, eventBus);

    const result = await useCase.execute({
      signupRequestId: "request-1",
      reviewedByUserId: "reviewer-1",
      rejectionReason: "  Not a fit right now  "
    });

    expect(tx.companySignupRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "request-1", status: "PENDING" },
        data: expect.objectContaining({
          status: "REJECTED",
          reviewedByUserId: "reviewer-1",
          rejectionReason: "Not a fit right now"
        })
      })
    );
    expect(result.status).toBe("REJECTED");
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "CompanySignupRequestRejected",
        payload: { companySignupRequestId: "request-1" }
      })
    );
  });

  it("rejects when the request was already reviewed", async () => {
    const tx = {
      companySignupRequest: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 })
      }
    };
    const prisma = {
      $transaction: jest.fn(async (callback: (transaction: typeof tx) => unknown) => callback(tx))
    } as unknown as PrismaService;
    const useCase = new RejectCompanySignupRequestUseCase(prisma, createEventBus());

    await expect(
      useCase.execute({
        signupRequestId: "request-1",
        reviewedByUserId: "reviewer-1",
        rejectionReason: "No"
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
