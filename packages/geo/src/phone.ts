import { AMERICA_COUNTRIES } from "./countries";
import type { CountryCode as PhoneCountryCode } from "libphonenumber-js/min";
import { parsePhoneNumberFromString } from "libphonenumber-js/min";
import type { CallingCode, CountryCode, E164PhoneNumber } from "./country-types";
import { getCountryByCode, isSupportedCountryCode, normalizeCountryCode } from "./geo-validation";

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

export interface SupportedPhoneNumber {
  readonly e164: E164PhoneNumber;
  readonly countryCode: CountryCode;
  readonly callingCode: CallingCode;
  readonly nationalNumber: string;
}

export const parseSupportedPhoneNumber = (
  value: string | null | undefined,
  countryCode?: string | null
): SupportedPhoneNumber | null => {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  const defaultCountry = normalizeCountryCode(countryCode);
  const internationalized = trimmed.replace(/^[\s()-.]*00/, "+");
  const phoneNumber = parsePhoneNumberFromString(
    internationalized,
    defaultCountry ? (defaultCountry as PhoneCountryCode) : undefined
  );

  if (!phoneNumber?.isValid() || !phoneNumber.country) {
    return null;
  }

  const parsedCountryCode = phoneNumber.country;

  if (!isSupportedCountryCode(parsedCountryCode)) {
    return null;
  }

  const callingCode = `+${phoneNumber.countryCallingCode}`;

  if (!isSupportedCallingCode(callingCode)) {
    return null;
  }

  return {
    e164: phoneNumber.number as E164PhoneNumber,
    countryCode: parsedCountryCode as CountryCode,
    callingCode,
    nationalNumber: phoneNumber.nationalNumber
  };
};

export const normalizePhoneNumber = (
  value: string | null | undefined,
  countryCode?: string | null
): string | null => parseSupportedPhoneNumber(value, countryCode)?.e164 ?? null;

export const isSupportedPhoneNumber = (
  value: string | null | undefined,
  countryCode?: string | null
): boolean => Boolean(parseSupportedPhoneNumber(value, countryCode));
