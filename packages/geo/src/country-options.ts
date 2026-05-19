import { AMERICA_COUNTRIES, DEFAULT_COUNTRY_CODE } from "./countries";
import type { CallingCodeOption, CountryOption } from "./country-types";

const sortDefaultCountryFirst = <TOption extends { readonly countryCode?: string; readonly value?: string }>(
  left: TOption,
  right: TOption
) => {
  const leftCode = left.countryCode ?? left.value;
  const rightCode = right.countryCode ?? right.value;

  if (leftCode === DEFAULT_COUNTRY_CODE) {
    return -1;
  }

  if (rightCode === DEFAULT_COUNTRY_CODE) {
    return 1;
  }

  return 0;
};

export const getCountryOptions = (): readonly CountryOption[] =>
  AMERICA_COUNTRIES.map((country) => ({
    value: country.code,
    label: country.name
  })).sort(sortDefaultCountryFirst);

export const getCallingCodeOptions = (): readonly CallingCodeOption[] =>
  AMERICA_COUNTRIES.flatMap((country) =>
    country.callingCodes.map((callingCode) => ({
      value: callingCode,
      label: `${country.flagEmoji} ${callingCode}`,
      countryCode: country.code,
      countryName: country.name,
      flagEmoji: country.flagEmoji
    }))
  ).sort(sortDefaultCountryFirst);
