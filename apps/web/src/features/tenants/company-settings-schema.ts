import { z } from "zod";
import { isSupportedTimeZone } from "@hr-app/timezones";

export const companySettingsSchema = z.object({
  name: z.string().trim().min(2, "Company name must have at least 2 characters.").max(120),
  defaultLanguage: z.enum(["es", "en"]),
  defaultCurrency: z.enum(["BOB", "USD"]),
  timezone: z
    .string()
    .trim()
    .min(1, "Timezone is required.")
    .max(80)
    .refine((value) => Boolean(isSupportedTimeZone(value)), "Select a supported timezone.")
});

export type CompanySettingsFormValues = z.infer<typeof companySettingsSchema>;
