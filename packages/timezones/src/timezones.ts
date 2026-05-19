export type IanaTimeZone = string & { readonly __brand: "IanaTimeZone" };

export interface TimeZoneOption {
  readonly value: IanaTimeZone;
  readonly label: string;
}

export const DEFAULT_TIME_ZONE = "America/La_Paz" as IanaTimeZone;
export const FALLBACK_TIME_ZONE = "UTC" as IanaTimeZone;

const supportedTimeZoneValues = [
  "America/La_Paz",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/Tijuana",
  "America/Cancun",
  "America/Bogota",
  "America/Lima",
  "America/Argentina/Buenos_Aires",
  "America/Santiago",
  "America/Sao_Paulo",
  "UTC"
] as const;

const supportedTimeZoneLabels: Record<(typeof supportedTimeZoneValues)[number], string> = {
  "America/La_Paz": "La Paz (America/La_Paz)",
  "America/New_York": "New York (America/New_York)",
  "America/Chicago": "Chicago (America/Chicago)",
  "America/Denver": "Denver (America/Denver)",
  "America/Phoenix": "Phoenix (America/Phoenix)",
  "America/Los_Angeles": "Los Angeles (America/Los_Angeles)",
  "America/Mexico_City": "Mexico City (America/Mexico_City)",
  "America/Tijuana": "Tijuana (America/Tijuana)",
  "America/Cancun": "Cancun (America/Cancun)",
  "America/Bogota": "Bogota (America/Bogota)",
  "America/Lima": "Lima (America/Lima)",
  "America/Argentina/Buenos_Aires": "Buenos Aires (America/Argentina/Buenos_Aires)",
  "America/Santiago": "Santiago (America/Santiago)",
  "America/Sao_Paulo": "Sao Paulo (America/Sao_Paulo)",
  UTC: "UTC"
};

export const SUPPORTED_TIME_ZONES = supportedTimeZoneValues;

const supportedTimeZoneSet = new Set<string>(SUPPORTED_TIME_ZONES);

export const isIanaTimeZone = (value: string): value is IanaTimeZone => {
  if (!value.trim()) {
    return false;
  }

  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
};

export const isSupportedTimeZone = (value: string): value is IanaTimeZone =>
  supportedTimeZoneSet.has(value) && isIanaTimeZone(value);

export const normalizeTimeZone = (value: string | null | undefined): IanaTimeZone | null => {
  const normalized = value?.trim();

  return normalized && isSupportedTimeZone(normalized) ? normalized : null;
};

export const getAmericaTimeZoneOptions = (): readonly TimeZoneOption[] =>
  SUPPORTED_TIME_ZONES.map((value) => ({
    value: value as IanaTimeZone,
    label: supportedTimeZoneLabels[value]
  }));

export const getTimeZoneOption = (value: string): TimeZoneOption | null => {
  const normalized = normalizeTimeZone(value);

  if (!normalized) {
    return null;
  }

  return {
    value: normalized,
    label: supportedTimeZoneLabels[normalized as (typeof supportedTimeZoneValues)[number]]
  };
};
