import { z } from "zod";
import { isSupportedCountryCode, normalizeCountryCode, normalizePhoneNumber } from "@hr-app/geo";
import { isSupportedTimeZone } from "@hr-app/timezones";

const tenantSlugPattern = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/;
const optionalTrimmedString = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .transform((value) => (value === "" ? undefined : value));

const requiredTrimmedString = (message: string, maxLength: number) =>
  z.string().trim().min(1, message).max(maxLength);
const optionalCountryCode = z
  .string()
  .trim()
  .max(80)
  .transform((value) => {
    const countryCode = normalizeCountryCode(value);
    return countryCode ? String(countryCode) : value === "" ? undefined : value;
  })
  .refine((value) => value === undefined || Boolean(isSupportedCountryCode(value)), "Select a supported country.");

export const normalizeTenantSlugInput = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, "-");

export const normalizeEmailInput = (value: string) => value.trim().toLowerCase();

export const normalizeWebsiteInput = (value: string) => value.trim();

const companySignupBaseSchema = z.object({
  adminEmail: z.string().trim().email("Enter a valid email.").max(254, "Email is too long.").transform(normalizeEmailInput),
  adminFirstName: z.string().trim().min(1, "Enter the admin first name.").max(80, "First name is too long."),
  adminLastName: z.string().trim().min(1, "Enter the admin last name.").max(80, "Last name is too long."),
  companyName: z.string().trim().min(2, "Enter the company name.").max(160, "Company name is too long."),
  companySize: requiredTrimmedString("Select a company size.", 80),
  companyWebsite: optionalTrimmedString(200).refine(
    (value) => !value || value.includes("."),
    "Enter a valid company website."
  ),
  country: optionalCountryCode,
  desiredTenantSlug: z
    .string()
    .transform(normalizeTenantSlugInput)
    .pipe(
      z
        .string()
        .min(3, "Workspace slug must be at least 3 characters.")
        .max(63, "Workspace slug is too long.")
        .regex(tenantSlugPattern, "Use lowercase letters, numbers, and hyphens only.")
    ),
  message: optionalTrimmedString(1000),
  phone: optionalTrimmedString(40),
  preferredLanguage: z.enum(["es", "en"]),
  timezone: requiredTrimmedString("Select a timezone.", 80).refine(
    (value) => Boolean(isSupportedTimeZone(value)),
    "Select a supported timezone."
  )
});

export const companySignupSchema = companySignupBaseSchema
  .superRefine((values, context) => {
    if (values.phone && !normalizePhoneNumber(values.phone, values.country)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid phone number with a supported calling code.",
        path: ["phone"]
      });
    }
  })
  .transform((values) => ({
    ...values,
    phone: normalizePhoneNumber(values.phone, values.country) ?? undefined
  }));

export type CompanySignupFormValues = z.input<typeof companySignupSchema>;
export type CompanySignupRequestPayload = z.output<typeof companySignupSchema>;

export const canCheckTenantSlugAvailability = (value: string) =>
  companySignupBaseSchema.shape.desiredTenantSlug.safeParse(value).success;

export const canCheckAdminEmailAvailability = (value: string) =>
  companySignupBaseSchema.shape.adminEmail.safeParse(value).success;

export const canCheckCompanyWebsiteAvailability = (value: string) =>
  value.trim().length > 0 && companySignupBaseSchema.shape.companyWebsite.safeParse(value).success;
