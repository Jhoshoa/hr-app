import { AMERICA_COUNTRIES } from "./countries";
import type { CallingCodeOption, CountryOption } from "./country-types";

export const getCountryOptions = (): readonly CountryOption[] =>
  AMERICA_COUNTRIES.map((country) => ({
    value: country.code,
    label: country.name
  }));

export const getCallingCodeOptions = (): readonly CallingCodeOption[] =>
  AMERICA_COUNTRIES.flatMap((country) =>
    country.callingCodes.map((callingCode) => ({
      value: callingCode,
      label: `${country.flagEmoji} ${callingCode}`,
      countryCode: country.code,
      countryName: country.name,
      flagEmoji: country.flagEmoji
    }))
  );
