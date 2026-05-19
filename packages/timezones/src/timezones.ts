export type IanaTimeZone = string & { readonly __brand: "IanaTimeZone" };

export interface TimeZoneOption {
  readonly value: IanaTimeZone;
  readonly label: string;
}

export const DEFAULT_TIME_ZONE = "America/New_York" as IanaTimeZone;
export const FALLBACK_TIME_ZONE = "UTC" as IanaTimeZone;

const supportedTimeZoneValues = [
  "America/New_York",
  "America/Detroit",
  "America/Kentucky/Louisville",
  "America/Kentucky/Monticello",
  "America/Indiana/Indianapolis",
  "America/Indiana/Vincennes",
  "America/Indiana/Winamac",
  "America/Indiana/Marengo",
  "America/Indiana/Petersburg",
  "America/Indiana/Vevay",
  "America/Chicago",
  "America/Indiana/Tell_City",
  "America/Indiana/Knox",
  "America/Menominee",
  "America/North_Dakota/Center",
  "America/North_Dakota/New_Salem",
  "America/North_Dakota/Beulah",
  "America/Denver",
  "America/Boise",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "America/Juneau",
  "America/Sitka",
  "America/Metlakatla",
  "America/Yakutat",
  "America/Nome",
  "America/Adak",
  "Pacific/Honolulu",
  "America/Puerto_Rico",
  "America/La_Paz",
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
  "America/New_York": "New York (America/New_York)",
  "America/Detroit": "Detroit (America/Detroit)",
  "America/Kentucky/Louisville": "Louisville (America/Kentucky/Louisville)",
  "America/Kentucky/Monticello": "Monticello, Kentucky (America/Kentucky/Monticello)",
  "America/Indiana/Indianapolis": "Indianapolis (America/Indiana/Indianapolis)",
  "America/Indiana/Vincennes": "Vincennes, Indiana (America/Indiana/Vincennes)",
  "America/Indiana/Winamac": "Winamac, Indiana (America/Indiana/Winamac)",
  "America/Indiana/Marengo": "Marengo, Indiana (America/Indiana/Marengo)",
  "America/Indiana/Petersburg": "Petersburg, Indiana (America/Indiana/Petersburg)",
  "America/Indiana/Vevay": "Vevay, Indiana (America/Indiana/Vevay)",
  "America/Chicago": "Chicago (America/Chicago)",
  "America/Indiana/Tell_City": "Tell City, Indiana (America/Indiana/Tell_City)",
  "America/Indiana/Knox": "Knox, Indiana (America/Indiana/Knox)",
  "America/Menominee": "Menominee, Michigan (America/Menominee)",
  "America/North_Dakota/Center": "Center, North Dakota (America/North_Dakota/Center)",
  "America/North_Dakota/New_Salem": "New Salem, North Dakota (America/North_Dakota/New_Salem)",
  "America/North_Dakota/Beulah": "Beulah, North Dakota (America/North_Dakota/Beulah)",
  "America/Denver": "Denver (America/Denver)",
  "America/Boise": "Boise (America/Boise)",
  "America/Phoenix": "Phoenix (America/Phoenix)",
  "America/Los_Angeles": "Los Angeles (America/Los_Angeles)",
  "America/Anchorage": "Anchorage (America/Anchorage)",
  "America/Juneau": "Juneau (America/Juneau)",
  "America/Sitka": "Sitka (America/Sitka)",
  "America/Metlakatla": "Metlakatla (America/Metlakatla)",
  "America/Yakutat": "Yakutat (America/Yakutat)",
  "America/Nome": "Nome (America/Nome)",
  "America/Adak": "Adak (America/Adak)",
  "Pacific/Honolulu": "Honolulu (Pacific/Honolulu)",
  "America/Puerto_Rico": "Puerto Rico (America/Puerto_Rico)",
  "America/La_Paz": "La Paz (America/La_Paz)",
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

export interface TenantTimeZoneSource {
  readonly timezone?: string | null;
}

export interface LocationTimeZoneSource {
  readonly timezone?: string | null;
}

export interface EmployeeTimeZoneSource {
  readonly timezone?: string | null;
  readonly currentLocation?: LocationTimeZoneSource | null;
}

export const resolveTenantDefaultTimeZone = (
  tenant?: TenantTimeZoneSource | null
): IanaTimeZone => normalizeTimeZone(tenant?.timezone) ?? DEFAULT_TIME_ZONE;

export const resolveLocationOperationalTimeZone = (input: {
  readonly tenant?: TenantTimeZoneSource | null;
  readonly location?: LocationTimeZoneSource | null;
}): IanaTimeZone =>
  normalizeTimeZone(input.location?.timezone) ??
  normalizeTimeZone(input.tenant?.timezone) ??
  DEFAULT_TIME_ZONE;

export const resolveEmployeeOperationalTimeZone = (input: {
  readonly tenant?: TenantTimeZoneSource | null;
  readonly employee?: EmployeeTimeZoneSource | null;
}): IanaTimeZone =>
  normalizeTimeZone(input.employee?.timezone) ??
  normalizeTimeZone(input.employee?.currentLocation?.timezone) ??
  normalizeTimeZone(input.tenant?.timezone) ??
  DEFAULT_TIME_ZONE;

export const resolveDisplayTimeZone = (input: {
  readonly tenant?: TenantTimeZoneSource | null;
  readonly userTimezone?: string | null;
  readonly contextLocation?: LocationTimeZoneSource | null;
}): IanaTimeZone =>
  normalizeTimeZone(input.userTimezone) ??
  normalizeTimeZone(input.contextLocation?.timezone) ??
  normalizeTimeZone(input.tenant?.timezone) ??
  DEFAULT_TIME_ZONE;

export const formatDateTimeInTimeZone = (
  value: string | number | Date,
  input: {
    readonly locale?: string;
    readonly timeZone: string;
    readonly dateStyle?: Intl.DateTimeFormatOptions["dateStyle"];
    readonly timeStyle?: Intl.DateTimeFormatOptions["timeStyle"];
  }
): string => {
  const timeZone = normalizeTimeZone(input.timeZone) ?? DEFAULT_TIME_ZONE;

  return new Intl.DateTimeFormat(input.locale ?? "en-US", {
    dateStyle: input.dateStyle ?? "medium",
    timeStyle: input.timeStyle ?? "short",
    timeZone
  }).format(new Date(value));
};

export const formatDateInTimeZone = (
  value: string | number | Date,
  input: {
    readonly locale?: string;
    readonly timeZone: string;
    readonly dateStyle?: Intl.DateTimeFormatOptions["dateStyle"];
  }
): string => {
  const timeZone = normalizeTimeZone(input.timeZone) ?? DEFAULT_TIME_ZONE;

  return new Intl.DateTimeFormat(input.locale ?? "en-US", {
    dateStyle: input.dateStyle ?? "medium",
    timeZone
  }).format(new Date(value));
};
