import type { IanaTimeZone } from "@hr-app/timezones";

export type CountryCode = string & { readonly __brand: "CountryCode" };
export type CallingCode = `+${number}`;

export interface CountryMetadata {
  readonly code: CountryCode;
  readonly name: string;
  readonly callingCodes: readonly CallingCode[];
  readonly timeZones: readonly IanaTimeZone[];
  readonly defaultTimeZone: IanaTimeZone;
}

export interface CountryOption {
  readonly value: CountryCode;
  readonly label: string;
}

export const DEFAULT_COUNTRY_CODE = "BO" as CountryCode;
const timeZone = (value: string) => value as IanaTimeZone;

export const AMERICA_COUNTRIES = [
  {
    code: "BO" as CountryCode,
    name: "Bolivia",
    callingCodes: ["+591"],
    timeZones: [timeZone("America/La_Paz")],
    defaultTimeZone: timeZone("America/La_Paz")
  },
  {
    code: "US" as CountryCode,
    name: "United States",
    callingCodes: ["+1"],
    timeZones: [
      timeZone("America/New_York"),
      timeZone("America/Chicago"),
      timeZone("America/Denver"),
      timeZone("America/Phoenix"),
      timeZone("America/Los_Angeles")
    ],
    defaultTimeZone: timeZone("America/New_York")
  },
  {
    code: "MX" as CountryCode,
    name: "Mexico",
    callingCodes: ["+52"],
    timeZones: [timeZone("America/Mexico_City"), timeZone("America/Tijuana"), timeZone("America/Cancun")],
    defaultTimeZone: timeZone("America/Mexico_City")
  },
  {
    code: "CO" as CountryCode,
    name: "Colombia",
    callingCodes: ["+57"],
    timeZones: [timeZone("America/Bogota")],
    defaultTimeZone: timeZone("America/Bogota")
  },
  {
    code: "PE" as CountryCode,
    name: "Peru",
    callingCodes: ["+51"],
    timeZones: [timeZone("America/Lima")],
    defaultTimeZone: timeZone("America/Lima")
  },
  {
    code: "AR" as CountryCode,
    name: "Argentina",
    callingCodes: ["+54"],
    timeZones: [timeZone("America/Argentina/Buenos_Aires")],
    defaultTimeZone: timeZone("America/Argentina/Buenos_Aires")
  },
  {
    code: "CL" as CountryCode,
    name: "Chile",
    callingCodes: ["+56"],
    timeZones: [timeZone("America/Santiago")],
    defaultTimeZone: timeZone("America/Santiago")
  },
  {
    code: "BR" as CountryCode,
    name: "Brazil",
    callingCodes: ["+55"],
    timeZones: [timeZone("America/Sao_Paulo")],
    defaultTimeZone: timeZone("America/Sao_Paulo")
  }
] as const satisfies readonly CountryMetadata[];

const countryByCode = new Map<string, CountryMetadata>(
  AMERICA_COUNTRIES.map((country) => [country.code, country])
);

const legacyCountryNameByCode = new Map<string, CountryCode>(
  AMERICA_COUNTRIES.flatMap((country) => [
    [country.name.toLowerCase(), country.code],
    [country.code.toLowerCase(), country.code]
  ])
);

export const getAmericaCountries = (): readonly CountryMetadata[] => AMERICA_COUNTRIES;

export const getCountryOptions = (): readonly CountryOption[] =>
  AMERICA_COUNTRIES.map((country) => ({
    value: country.code,
    label: country.name
  }));

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

export const getCountryDefaultTimeZone = (value: string): IanaTimeZone | null =>
  getCountryByCode(value)?.defaultTimeZone ?? null;

export const getCountryTimeZones = (value: string): readonly IanaTimeZone[] =>
  getCountryByCode(value)?.timeZones ?? [];
