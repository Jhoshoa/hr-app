import { describe, expect, it } from "vitest";
import { companySettingsSchema } from "./company-settings-schema";

describe("companySettingsSchema", () => {
  it("accepts supported company localization settings", () => {
    const result = companySettingsSchema.safeParse({
      name: "AssureSoft Demo",
      defaultLanguage: "es",
      defaultCurrency: "BOB",
      timezone: "America/La_Paz"
    });

    expect(result.success).toBe(true);
  });

  it("rejects unsupported language and currency values", () => {
    const result = companySettingsSchema.safeParse({
      name: "A",
      defaultLanguage: "fr",
      defaultCurrency: "EUR",
      timezone: ""
    });

    expect(result.success).toBe(false);
  });
});
