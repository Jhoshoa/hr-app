import { describe, expect, it } from "vitest";
import {
  canReviewCompanySignup,
  getCompanySignupAdminName,
  getCompanySignupStatusTone,
  getPlatformCompanySignupTotalPages,
  isValidPlatformTenantSlug
} from "./platform-company-signups-utils";
import type { PlatformCompanySignupRequest } from "./company-signup-types";

const request: PlatformCompanySignupRequest = {
  id: "request-1",
  companyName: "Acme Corp",
  desiredTenantSlug: "acme",
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
  status: "PENDING",
  approvedTenantId: null,
  approvedTenant: null,
  reviewedByUserId: null,
  reviewedAt: null,
  rejectionReason: null,
  createdAt: "2026-05-14T00:00:00.000Z",
  updatedAt: "2026-05-14T00:00:00.000Z"
};

describe("platform company signup utils", () => {
  it("allows only owner/admin roles to review signup requests", () => {
    expect(canReviewCompanySignup(["PLATFORM_OWNER"])).toBe(true);
    expect(canReviewCompanySignup(["PLATFORM_ADMIN"])).toBe(true);
    expect(canReviewCompanySignup(["PLATFORM_SUPPORT"])).toBe(false);
  });

  it("maps request status to badge tones", () => {
    expect(getCompanySignupStatusTone("PENDING")).toBe("amber");
    expect(getCompanySignupStatusTone("APPROVED")).toBe("green");
    expect(getCompanySignupStatusTone("REJECTED")).toBe("red");
  });

  it("builds admin display names and server pagination counts", () => {
    expect(getCompanySignupAdminName(request)).toBe("Ana Owner");
    expect(getPlatformCompanySignupTotalPages(0)).toBe(1);
    expect(getPlatformCompanySignupTotalPages(11)).toBe(2);
  });

  it("validates final platform tenant slugs before approval", () => {
    expect(isValidPlatformTenantSlug("acme-demo")).toBe(true);
    expect(isValidPlatformTenantSlug("-acme")).toBe(false);
    expect(isValidPlatformTenantSlug("a")).toBe(false);
  });
});
