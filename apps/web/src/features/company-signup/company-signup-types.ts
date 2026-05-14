export interface CompanySignupRequestResponse {
  readonly id: string;
  readonly status: "PENDING" | "APPROVED" | "REJECTED";
  readonly companyName: string;
  readonly desiredTenantSlug: string;
  readonly adminEmail: string;
  readonly createdAt: string;
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
