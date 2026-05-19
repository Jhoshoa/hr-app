import {
  isSupportedCountryCode,
  isSupportedPhoneNumber,
  isSupportedSubdivisionCode
} from "@hr-app/geo";
import { isSupportedTimeZone } from "@hr-app/timezones";

export type GeoTimezoneAuditSeverity = "error" | "warning";

export type GeoTimezoneAuditResource =
  | "Tenant"
  | "Location"
  | "CompanySignupRequest";

export interface GeoTimezoneAuditFinding {
  readonly severity: GeoTimezoneAuditSeverity;
  readonly resource: GeoTimezoneAuditResource;
  readonly id: string;
  readonly field: string;
  readonly value: string | null;
  readonly message: string;
}

export interface GeoTimezoneAuditTenant {
  readonly id: string;
  readonly timezone: string | null;
}

export interface GeoTimezoneAuditLocation {
  readonly id: string;
  readonly tenantId: string;
  readonly country: string | null;
  readonly subdivisionCode: string | null;
  readonly timezone: string | null;
}

export interface GeoTimezoneAuditCompanySignupRequest {
  readonly id: string;
  readonly country: string | null;
  readonly phone: string | null;
  readonly timezone: string | null;
}

export interface GeoTimezoneAuditInput {
  readonly tenants: readonly GeoTimezoneAuditTenant[];
  readonly locations: readonly GeoTimezoneAuditLocation[];
  readonly companySignupRequests: readonly GeoTimezoneAuditCompanySignupRequest[];
}

export interface GeoTimezoneAuditSummary {
  readonly totalFindings: number;
  readonly errors: number;
  readonly warnings: number;
}

export interface GeoTimezoneAuditReport {
  readonly summary: GeoTimezoneAuditSummary;
  readonly findings: readonly GeoTimezoneAuditFinding[];
}

export const auditGeoTimezoneData = (input: GeoTimezoneAuditInput): GeoTimezoneAuditReport => {
  const findings: GeoTimezoneAuditFinding[] = [
    ...auditTenants(input.tenants),
    ...auditLocations(input.locations),
    ...auditCompanySignupRequests(input.companySignupRequests)
  ];
  const errors = findings.filter((finding) => finding.severity === "error").length;
  const warnings = findings.length - errors;

  return {
    summary: {
      totalFindings: findings.length,
      errors,
      warnings
    },
    findings
  };
};

const auditTenants = (
  tenants: readonly GeoTimezoneAuditTenant[]
): readonly GeoTimezoneAuditFinding[] =>
  tenants.flatMap((tenant) => {
    if (tenant.timezone && isSupportedTimeZone(tenant.timezone)) {
      return [];
    }

    return [
      {
        severity: "error",
        resource: "Tenant",
        id: tenant.id,
        field: "timezone",
        value: tenant.timezone,
        message: "Tenant timezone must be in the supported product timezone catalog."
      }
    ];
  });

const auditLocations = (
  locations: readonly GeoTimezoneAuditLocation[]
): readonly GeoTimezoneAuditFinding[] =>
  locations.flatMap((location) => {
    const findings: GeoTimezoneAuditFinding[] = [];
    const country = location.country?.trim().toUpperCase() ?? null;

    if (!country || !isSupportedCountryCode(country)) {
      findings.push({
        severity: "error",
        resource: "Location",
        id: location.id,
        field: "country",
        value: location.country,
        message: "Location country must be a supported ISO alpha-2 country code."
      });
    }

    if (location.timezone && !isSupportedTimeZone(location.timezone)) {
      findings.push({
        severity: "error",
        resource: "Location",
        id: location.id,
        field: "timezone",
        value: location.timezone,
        message: "Location timezone must be in the supported product timezone catalog."
      });
    }

    if (!location.timezone) {
      findings.push({
        severity: "error",
        resource: "Location",
        id: location.id,
        field: "timezone",
        value: location.timezone,
        message: "Location timezone is required for operational date calculations."
      });
    }

    if (
      location.subdivisionCode &&
      country &&
      isSupportedCountryCode(country) &&
      !isSupportedSubdivisionCode(country, location.subdivisionCode)
    ) {
      findings.push({
        severity: "warning",
        resource: "Location",
        id: location.id,
        field: "subdivisionCode",
        value: location.subdivisionCode,
        message: "Location subdivisionCode is not supported for the selected country."
      });
    }

    return findings;
  });

const auditCompanySignupRequests = (
  requests: readonly GeoTimezoneAuditCompanySignupRequest[]
): readonly GeoTimezoneAuditFinding[] =>
  requests.flatMap((request) => {
    const findings: GeoTimezoneAuditFinding[] = [];
    const country = request.country?.trim().toUpperCase() ?? null;

    if (country && !isSupportedCountryCode(country)) {
      findings.push({
        severity: "warning",
        resource: "CompanySignupRequest",
        id: request.id,
        field: "country",
        value: request.country,
        message: "Company signup country is not a supported ISO alpha-2 country code."
      });
    }

    if (request.timezone && !isSupportedTimeZone(request.timezone)) {
      findings.push({
        severity: "warning",
        resource: "CompanySignupRequest",
        id: request.id,
        field: "timezone",
        value: request.timezone,
        message: "Company signup timezone is not in the supported product timezone catalog."
      });
    }

    if (request.phone && !isSupportedPhoneNumber(request.phone, country)) {
      findings.push({
        severity: "warning",
        resource: "CompanySignupRequest",
        id: request.id,
        field: "phone",
        value: request.phone,
        message: "Company signup phone is not a valid supported E.164 phone number."
      });
    }

    return findings;
  });
