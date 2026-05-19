import { AMERICA_SUBDIVISIONS, getAmericaSubdivisions } from "./subdivisions";
import type { SubdivisionCode, SubdivisionMetadata } from "./subdivision-types";
import { normalizeCountryCode } from "./geo-validation";

const subdivisionsByCountry = new Map<string, readonly SubdivisionMetadata[]>(
  Array.from(new Set(AMERICA_SUBDIVISIONS.map((subdivision) => subdivision.countryCode))).map((countryCode) => [
    countryCode,
    AMERICA_SUBDIVISIONS.filter((subdivision) => subdivision.countryCode === countryCode)
  ])
);

export const getCountrySubdivisions = (countryCode: string): readonly SubdivisionMetadata[] => {
  const normalizedCountryCode = normalizeCountryCode(countryCode);

  return normalizedCountryCode ? subdivisionsByCountry.get(normalizedCountryCode) ?? [] : [];
};

export const isSupportedSubdivisionCode = (
  countryCode: string,
  value: string
): value is SubdivisionCode =>
  getCountrySubdivisions(countryCode).some((subdivision) => subdivision.code === value.trim().toUpperCase());

export const normalizeSubdivisionCode = (
  countryCode: string | null | undefined,
  value: string | null | undefined
): SubdivisionCode | null => {
  const normalized = value?.trim().toUpperCase();

  if (!countryCode || !normalized) {
    return null;
  }

  return isSupportedSubdivisionCode(countryCode, normalized) ? (normalized as SubdivisionCode) : null;
};

export { getAmericaSubdivisions };
