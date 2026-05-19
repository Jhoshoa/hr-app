import { z } from "zod";
import { isSupportedCountryCode, normalizeCountryCode, normalizePhoneNumber } from "@hr-app/geo";
import { isSupportedTimeZone } from "@hr-app/timezones";

const optionalTrimmedString = (maxLength: number) => z.string().trim().max(maxLength);

const optionalCountryCode = z
  .string()
  .trim()
  .max(80)
  .refine((value) => {
    const countryCode = normalizeCountryCode(value);
    return value === "" || Boolean(countryCode && isSupportedCountryCode(countryCode));
  }, "Select a supported country.");

const companySizeSchema = z.enum(["", "1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"]);

export const companySettingsSchema = z
  .object({
    name: z.string().trim().min(2, "Company name must have at least 2 characters.").max(120),
    defaultLanguage: z.enum(["es", "en"]),
    defaultCurrency: z.enum(["BOB", "USD"]),
    timezone: z
      .string()
      .trim()
      .min(1, "Timezone is required.")
      .max(80)
      .refine((value) => Boolean(isSupportedTimeZone(value)), "Select a supported timezone."),
    website: optionalTrimmedString(200).refine(
      (value) => !value || value.includes("."),
      "Enter a valid company website."
    ),
    companySize: companySizeSchema,
    country: optionalCountryCode,
    phone: optionalTrimmedString(40)
  })
  .superRefine((values, context) => {
    const country = normalizeCountryCode(values.country);

    if (values.phone && !normalizePhoneNumber(values.phone, country)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid phone number with a supported calling code.",
        path: ["phone"]
      });
    }
  });

export type CompanySettingsFormValues = z.infer<typeof companySettingsSchema>;
