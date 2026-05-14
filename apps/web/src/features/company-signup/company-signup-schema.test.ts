import { describe, expect, it } from "vitest";
import {
  canCheckAdminEmailAvailability,
  canCheckCompanyWebsiteAvailability,
  canCheckTenantSlugAvailability,
  companySignupSchema
} from "./company-signup-schema";

const validInput = {
  adminEmail: "OWNER@Example.COM ",
  adminFirstName: " Maria ",
  adminLastName: " Rojas ",
  companyName: " Acme Operations ",
  companySize: "51-200",
  companyWebsite: " https://acme.example ",
  country: "Bolivia",
  desiredTenantSlug: " Acme Operations ",
  message: " Needs approval ",
  phone: "+591 70000000",
  preferredLanguage: "es",
  timezone: "America/La_Paz"
};

describe("companySignupSchema", () => {
  it("normalizes payload values before submit", () => {
    expect(companySignupSchema.parse(validInput)).toEqual({
      adminEmail: "owner@example.com",
      adminFirstName: "Maria",
      adminLastName: "Rojas",
      companyName: "Acme Operations",
      companySize: "51-200",
      companyWebsite: "https://acme.example",
      country: "Bolivia",
      desiredTenantSlug: "acme-operations",
      message: "Needs approval",
      phone: "+591 70000000",
      preferredLanguage: "es",
      timezone: "America/La_Paz"
    });
  });

  it("converts empty optional fields to undefined", () => {
    const result = companySignupSchema.parse({
      ...validInput,
      companyWebsite: "",
      country: "",
      message: "",
      phone: "",
    });

    expect(result.companyWebsite).toBeUndefined();
    expect(result.country).toBeUndefined();
    expect(result.message).toBeUndefined();
    expect(result.phone).toBeUndefined();
  });

  it("requires company size, timezone, and preferred language", () => {
    const result = companySignupSchema.safeParse({
      ...validInput,
      companySize: "",
      preferredLanguage: "",
      timezone: ""
    });

    expect(result.success).toBe(false);
  });

  it("guards availability checks with local validation", () => {
    expect(canCheckTenantSlugAvailability("valid-slug")).toBe(true);
    expect(canCheckTenantSlugAvailability("bad slug!")).toBe(false);
    expect(canCheckAdminEmailAvailability("owner@example.com")).toBe(true);
    expect(canCheckAdminEmailAvailability("invalid-email")).toBe(false);
    expect(canCheckCompanyWebsiteAvailability("https://acme.example")).toBe(true);
    expect(canCheckCompanyWebsiteAvailability("not-a-domain")).toBe(false);
  });
});
