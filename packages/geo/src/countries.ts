import type { IanaTimeZone } from "@hr-app/timezones";
import type { CountryCode, CountryMetadata } from "./country-types";

export const DEFAULT_COUNTRY_CODE = "BO" as CountryCode;

const timeZone = (value: string) => value as IanaTimeZone;

const flagEmoji = (countryCode: string): string =>
  [...countryCode.toUpperCase()]
    .map((letter) => String.fromCodePoint(letter.charCodeAt(0) + 127397))
    .join("");

export const AMERICA_COUNTRIES = [
  {
    code: "BO" as CountryCode,
    name: "Bolivia",
    flagEmoji: flagEmoji("BO"),
    callingCodes: ["+591"],
    timeZones: [timeZone("America/La_Paz")],
    defaultTimeZone: timeZone("America/La_Paz")
  },
  {
    code: "US" as CountryCode,
    name: "United States",
    flagEmoji: flagEmoji("US"),
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
    flagEmoji: flagEmoji("MX"),
    callingCodes: ["+52"],
    timeZones: [timeZone("America/Mexico_City"), timeZone("America/Tijuana"), timeZone("America/Cancun")],
    defaultTimeZone: timeZone("America/Mexico_City")
  },
  {
    code: "CO" as CountryCode,
    name: "Colombia",
    flagEmoji: flagEmoji("CO"),
    callingCodes: ["+57"],
    timeZones: [timeZone("America/Bogota")],
    defaultTimeZone: timeZone("America/Bogota")
  },
  {
    code: "PE" as CountryCode,
    name: "Peru",
    flagEmoji: flagEmoji("PE"),
    callingCodes: ["+51"],
    timeZones: [timeZone("America/Lima")],
    defaultTimeZone: timeZone("America/Lima")
  },
  {
    code: "AR" as CountryCode,
    name: "Argentina",
    flagEmoji: flagEmoji("AR"),
    callingCodes: ["+54"],
    timeZones: [timeZone("America/Argentina/Buenos_Aires")],
    defaultTimeZone: timeZone("America/Argentina/Buenos_Aires")
  },
  {
    code: "CL" as CountryCode,
    name: "Chile",
    flagEmoji: flagEmoji("CL"),
    callingCodes: ["+56"],
    timeZones: [timeZone("America/Santiago")],
    defaultTimeZone: timeZone("America/Santiago")
  },
  {
    code: "BR" as CountryCode,
    name: "Brazil",
    flagEmoji: flagEmoji("BR"),
    callingCodes: ["+55"],
    timeZones: [timeZone("America/Sao_Paulo")],
    defaultTimeZone: timeZone("America/Sao_Paulo")
  }
] as const satisfies readonly CountryMetadata[];

export const getAmericaCountries = (): readonly CountryMetadata[] => AMERICA_COUNTRIES;
