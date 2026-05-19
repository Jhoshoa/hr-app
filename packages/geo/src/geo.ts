import type { IanaTimeZone } from "@hr-app/timezones";

export type CountryCode = string & { readonly __brand: "CountryCode" };
export type CallingCode = `+${number}`;
export type E164PhoneNumber = `+${number}`;

export interface CountryMetadata {
  readonly code: CountryCode;
  readonly name: string;
  readonly flagEmoji: string;
  readonly callingCodes: readonly CallingCode[];
  readonly timeZones: readonly IanaTimeZone[];
  readonly defaultTimeZone: IanaTimeZone;
}

export interface CountryOption {
  readonly value: CountryCode;
  readonly label: string;
}

export interface CallingCodeOption {
  readonly value: CallingCode;
  readonly label: string;
  readonly countryCode: CountryCode;
  readonly countryName: string;
  readonly flagEmoji: string;
}

export const DEFAULT_COUNTRY_CODE = "BO" as CountryCode;
const timeZone = (value: string) => value as IanaTimeZone;

export const AMERICA_COUNTRIES = [
  {
    code: "BO" as CountryCode,
    name: "Bolivia",
    flagEmoji: "🇧🇴",
    callingCodes: ["+591"],
    timeZones: [timeZone("America/La_Paz")],
    defaultTimeZone: timeZone("America/La_Paz")
  },
  {
    code: "US" as CountryCode,
    name: "United States",
    flagEmoji: "🇺🇸",
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
    flagEmoji: "🇲🇽",
    callingCodes: ["+52"],
    timeZones: [timeZone("America/Mexico_City"), timeZone("America/Tijuana"), timeZone("America/Cancun")],
    defaultTimeZone: timeZone("America/Mexico_City")
  },
  {
    code: "CO" as CountryCode,
    name: "Colombia",
    flagEmoji: "🇨🇴",
    callingCodes: ["+57"],
    timeZones: [timeZone("America/Bogota")],
    defaultTimeZone: timeZone("America/Bogota")
  },
  {
    code: "PE" as CountryCode,
    name: "Peru",
    flagEmoji: "🇵🇪",
    callingCodes: ["+51"],
    timeZones: [timeZone("America/Lima")],
    defaultTimeZone: timeZone("America/Lima")
  },
  {
    code: "AR" as CountryCode,
    name: "Argentina",
    flagEmoji: "🇦🇷",
    callingCodes: ["+54"],
    timeZones: [timeZone("America/Argentina/Buenos_Aires")],
    defaultTimeZone: timeZone("America/Argentina/Buenos_Aires")
  },
  {
    code: "CL" as CountryCode,
    name: "Chile",
    flagEmoji: "🇨🇱",
    callingCodes: ["+56"],
    timeZones: [timeZone("America/Santiago")],
    defaultTimeZone: timeZone("America/Santiago")
  },
  {
    code: "BR" as CountryCode,
    name: "Brazil",
    flagEmoji: "🇧🇷",
    callingCodes: ["+55"],
    timeZones: [timeZone("America/Sao_Paulo")],
    defaultTimeZone: timeZone("America/Sao_Paulo")
  }
] as const satisfies readonly CountryMetadata[];

const countryByCode = new Map<string, CountryMetadata>(
  AMERICA_COUNTRIES.map((country) => [country.code, country])
);

const supportedCallingCodes = Array.from(
  new Set(AMERICA_COUNTRIES.flatMap((country) => country.callingCodes))
).sort((left, right) => right.length - left.length);

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

export const getCountryCodeForTimeZone = (value: string): CountryCode | null => {
  const normalizedTimeZone = value.trim();
  const country = AMERICA_COUNTRIES.find((item) =>
    item.timeZones.some((timeZoneValue) => timeZoneValue === normalizedTimeZone)
  );

  return country?.code ?? null;
};

export const getCountryCallingCodes = (value: string): readonly CallingCode[] =>
  getCountryByCode(value)?.callingCodes ?? [];

export const getCountryDefaultCallingCode = (value: string | null | undefined): CallingCode | null => {
  const countryCode = value ? normalizeCountryCode(value) : null;

  return countryCode ? getCountryByCode(countryCode)?.callingCodes[0] ?? null : null;
};

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
