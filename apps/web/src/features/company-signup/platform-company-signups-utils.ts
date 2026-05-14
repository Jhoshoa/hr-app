import type { PlatformRoleKey } from "@/types/identity";
import type { CompanySignupStatus, PlatformCompanySignupRequest } from "./company-signup-types";

export const PLATFORM_COMPANY_SIGNUPS_PAGE_SIZE = 10;
export const platformTenantSlugPattern = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{1,61}[a-zA-Z0-9])$/;

export const canReviewCompanySignup = (roles: readonly PlatformRoleKey[]) =>
  roles.includes("PLATFORM_OWNER") || roles.includes("PLATFORM_ADMIN");

export const getCompanySignupStatusTone = (status: CompanySignupStatus) => {
  switch (status) {
    case "APPROVED":
      return "green";
    case "PENDING":
      return "amber";
    case "REJECTED":
      return "red";
    case "CANCELLED":
      return "gray";
    default:
      return "gray";
  }
};

export const getCompanySignupAdminName = (request: PlatformCompanySignupRequest) =>
  `${request.adminFirstName} ${request.adminLastName}`.trim();

export const getPlatformCompanySignupTotalPages = (total: number, pageSize = PLATFORM_COMPANY_SIGNUPS_PAGE_SIZE) =>
  Math.max(1, Math.ceil(total / pageSize));

export const isValidPlatformTenantSlug = (value: string) => platformTenantSlugPattern.test(value.trim());

export const formatPlatformDate = (value: string | null) => {
  if (!value) {
    return "Not reviewed";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
};
