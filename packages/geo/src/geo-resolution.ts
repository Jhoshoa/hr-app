import type { IanaTimeZone } from "@hr-app/timezones";
import { AMERICA_COUNTRIES } from "./countries";
import type { CountryCode } from "./country-types";
import { getCountryByCode } from "./geo-validation";

export const getCountryDefaultTimeZone = (value: string): IanaTimeZone | null =>
  getCountryByCode(value)?.defaultTimeZone ?? null;

export const getCountryTimeZones = (value: string): readonly IanaTimeZone[] =>
  getCountryByCode(value)?.timeZones ?? [];

export const getCountryCodeForTimeZone = (value: string): CountryCode | null => {
  const normalizedTimeZone = value.trim();
  const country = AMERICA_COUNTRIES.find((item) =>
    item.timeZones.some((timeZoneValue) => timeZoneValue === normalizedTimeZone)
  );

  return country?.code ?? null;
};
