import { AMERICA_COUNTRIES } from "./countries";
import type { CountryCode, CountryMetadata } from "./country-types";

const countryByCode = new Map<string, CountryMetadata>(
  AMERICA_COUNTRIES.map((country) => [country.code, country])
);

const legacyCountryNameByCode = new Map<string, CountryCode>(
  AMERICA_COUNTRIES.flatMap((country) => [
    [country.name.toLowerCase(), country.code],
    [country.code.toLowerCase(), country.code]
  ])
);

export const isSupportedCountryCode = (value: string): value is CountryCode =>
  countryByCode.has(value.trim().toUpperCase());

export const normalizeCountryCode = (value: string | null | undefined): CountryCode | null => {
  const normalized = value?.trim();

  if (!normalized) {
    return null;
  }

  const upper = normalized.toUpperCase();

  if (isSupportedCountryCode(upper)) {
    return upper as CountryCode;
  }

  return legacyCountryNameByCode.get(normalized.toLowerCase()) ?? null;
};

export const getCountryByCode = (value: string): CountryMetadata | null => {
  const code = normalizeCountryCode(value);

  return code ? countryByCode.get(code) ?? null : null;
};
