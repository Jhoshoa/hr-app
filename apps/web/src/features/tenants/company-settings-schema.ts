import { z } from "zod";

export const companySettingsSchema = z.object({
  name: z.string().trim().min(2, "Company name must have at least 2 characters.").max(120),
  defaultLanguage: z.enum(["es", "en"]),
  defaultCurrency: z.enum(["BOB", "USD"]),
  timezone: z.string().trim().min(1, "Timezone is required.").max(80)
});

export type CompanySettingsFormValues = z.infer<typeof companySettingsSchema>;
