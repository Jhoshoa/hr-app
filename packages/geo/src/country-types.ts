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
