import type { CountryCode } from "./country-types";

export type SubdivisionCode = string & { readonly __brand: "SubdivisionCode" };

export interface SubdivisionMetadata {
  readonly code: SubdivisionCode;
  readonly countryCode: CountryCode;
  readonly name: string;
}

export interface SubdivisionOption {
  readonly value: SubdivisionCode;
  readonly label: string;
}
