import { AMERICA_COUNTRIES } from "./countries";
import type { CallingCode } from "./country-types";
import { getCountryByCode, normalizeCountryCode } from "./geo-validation";

const supportedCallingCodes = Array.from(
  new Set(AMERICA_COUNTRIES.flatMap((country) => country.callingCodes))
).sort((left, right) => right.length - left.length);

export const getCountryCallingCodes = (value: string): readonly CallingCode[] =>
  getCountryByCode(value)?.callingCodes ?? [];

export const getCountryDefaultCallingCode = (value: string | null | undefined): CallingCode | null => {
  const countryCode = value ? normalizeCountryCode(value) : null;

  return countryCode ? getCountryByCode(countryCode)?.callingCodes[0] ?? null : null;
};

export const isSupportedCallingCode = (value: string): value is CallingCode =>
  supportedCallingCodes.some((callingCode) => callingCode === value);

export const normalizePhoneNumber = (
  value: string | null | undefined,
  countryCode?: string | null
): string | null => {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  const compact = trimmed.replace(/[\s().-]/g, "");
  const withPlus = compact.startsWith("00") ? `+${compact.slice(2)}` : compact;
  const candidate = withPlus.startsWith("+")
    ? withPlus
    : `${getCountryDefaultCallingCode(countryCode) ?? ""}${withPlus.replace(/\D/g, "")}`;

  if (!/^\+[1-9]\d{7,14}$/.test(candidate)) {
    return null;
  }

  const matchedCallingCode = supportedCallingCodes.find((callingCode) => candidate.startsWith(callingCode));

  if (!matchedCallingCode) {
    return null;
  }

  return candidate;
};
