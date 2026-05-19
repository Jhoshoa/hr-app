import { normalizeCountryCode, normalizePhoneNumber } from "@hr-app/geo";

export const normalizeTenantProfileOptionalText = (
  value: string | null | undefined
): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

export const normalizeTenantProfileWebsite = (
  value: string | null | undefined
): string | null => {
  const normalized = normalizeTenantProfileOptionalText(value)?.toLowerCase();

  if (!normalized) {
    return null;
  }

  return normalized.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
};

export const normalizeTenantProfileCountry = (
  value: string | null | undefined
): string | null => normalizeCountryCode(value) ?? null;

export const normalizeTenantProfilePhone = (
  value: string | null | undefined,
  countryCode: string | null | undefined
): string | null => normalizePhoneNumber(value, countryCode);

export const normalizeTenantProfileEmail = (
  value: string | null | undefined
): string | null => normalizeTenantProfileOptionalText(value)?.toLowerCase() ?? null;
