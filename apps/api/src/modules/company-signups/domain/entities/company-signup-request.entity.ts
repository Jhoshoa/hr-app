import type { CompanySignupStatus } from "@prisma/client";

export interface CompanySignupRequestEntity {
  readonly id: string;
  readonly companyName: string;
  readonly desiredTenantSlug: string;
  readonly adminFirstName: string;
  readonly adminLastName: string;
  readonly adminEmail: string;
  readonly companyWebsite: string | null;
  readonly companySize: string | null;
  readonly country: string | null;
  readonly timezone: string | null;
  readonly preferredLanguage: string;
  readonly phone: string | null;
  readonly message: string | null;
  readonly status: CompanySignupStatus;
  readonly approvedTenantId: string | null;
  readonly reviewedByUserId: string | null;
  readonly reviewedAt: Date | null;
  readonly rejectionReason: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateCompanySignupRequestInput {
  readonly companyName: string;
  readonly desiredTenantSlug: string;
  readonly adminFirstName: string;
  readonly adminLastName: string;
  readonly adminEmail: string;
  readonly companyWebsite?: string;
  readonly companySize?: string;
  readonly country?: string;
  readonly timezone?: string;
  readonly preferredLanguage: string;
  readonly phone?: string;
  readonly message?: string;
}

export interface AvailabilityResult {
  readonly value: string;
  readonly available: boolean;
  readonly reason?: string;
}

export interface AdminEmailAvailabilityResult extends AvailabilityResult {
  readonly existingUser: boolean;
  readonly canReuseExistingUser: boolean;
}

export interface CompanyWebsiteAvailabilityResult {
  readonly value: string;
  readonly duplicateWarning: boolean;
  readonly matchingPendingRequestCount: number;
}

export interface ListCompanySignupRequestsInput {
  readonly status?: CompanySignupStatus;
  readonly search?: string;
  readonly page: number;
  readonly pageSize: number;
}

export interface ListCompanySignupRequestsResult {
  readonly items: CompanySignupRequestEntity[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
}
