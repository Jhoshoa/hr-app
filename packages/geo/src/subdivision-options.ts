import { getCountrySubdivisions } from "./subdivision-validation";
import type { SubdivisionOption } from "./subdivision-types";

export const getSubdivisionOptions = (countryCode: string | null | undefined): readonly SubdivisionOption[] =>
  countryCode
    ? getCountrySubdivisions(countryCode).map((subdivision) => ({
        value: subdivision.code,
        label: subdivision.name
      }))
    : [];
