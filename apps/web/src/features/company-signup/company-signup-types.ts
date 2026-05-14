export interface CompanySignupRequestResponse {
  readonly id: string;
  readonly status: CompanySignupStatus;
  readonly companyName: string;
  readonly desiredTenantSlug: string;
  readonly adminEmail: string;
  readonly createdAt: string;
}

export type CompanySignupStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface PlatformCompanySignupRequest {
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
  readonly approvedTenant: PlatformCompanySignupApprovedTenant | null;
  readonly reviewedByUserId: string | null;
  readonly reviewedAt: string | null;
  readonly rejectionReason: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PlatformCompanySignupApprovedTenant {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly status: "ACTIVE" | "SUSPENDED" | "ARCHIVED";
}

export interface PlatformCompanySignupRequestsResponse {
  readonly items: PlatformCompanySignupRequest[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
}

export interface ListPlatformCompanySignupRequestsParams {
  readonly page: number;
  readonly pageSize: number;
  readonly search?: string;
  readonly status?: CompanySignupStatus | "ALL";
}

export interface ApprovePlatformCompanySignupRequestPayload {
  readonly id: string;
  readonly finalTenantSlug?: string;
  readonly initialAdminRoleKey?: "owner";
}

export interface RejectPlatformCompanySignupRequestPayload {
  readonly id: string;
  readonly rejectionReason: string;
}

export interface PlatformTenantResponse {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly status: "ACTIVE" | "SUSPENDED" | "ARCHIVED";
  readonly defaultLanguage: string;
  readonly defaultCurrency: string;
  readonly timezone: string;
}

export interface AvailabilityResponse {
  readonly value: string;
  readonly available: boolean;
  readonly reason?: "INVALID_FORMAT" | "RESERVED" | "TENANT_EXISTS" | "PENDING_REQUEST_EXISTS";
}

export interface AdminEmailAvailabilityResponse extends AvailabilityResponse {
  readonly existingUser: boolean;
  readonly canReuseExistingUser: boolean;
}

export interface CompanyWebsiteAvailabilityResponse {
  readonly value: string;
  readonly duplicateWarning: boolean;
  readonly matchingPendingRequestCount: number;
}
