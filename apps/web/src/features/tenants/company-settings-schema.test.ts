import { describe, expect, it } from "vitest";
import { companySettingsSchema } from "./company-settings-schema";

describe("companySettingsSchema", () => {
  const validInput = {
    name: "AssureSoft Demo",
    defaultLanguage: "en",
    defaultCurrency: "BOB",
    timezone: "America/La_Paz",
    website: "",
    companySize: "",
    country: "",
    phone: ""
  };

  it("accepts supported company localization settings", () => {
    const result = companySettingsSchema.safeParse(validInput);

    expect(result.success).toBe(true);
  });

  it("rejects unsupported language and currency values", () => {
    const result = companySettingsSchema.safeParse({
      ...validInput,
      name: "A",
      defaultLanguage: "fr",
      defaultCurrency: "EUR",
      timezone: ""
    });

    expect(result.success).toBe(false);
  });

  it("rejects unsupported timezone values", () => {
    const result = companySettingsSchema.safeParse({
      ...validInput,
      timezone: "not-a-timezone"
    });

    expect(result.success).toBe(false);
  });

  it("rejects valid IANA timezones outside the product catalog", () => {
    const result = companySettingsSchema.safeParse({
      ...validInput,
      timezone: "Europe/Madrid"
    });

    expect(result.success).toBe(false);
  });
});
