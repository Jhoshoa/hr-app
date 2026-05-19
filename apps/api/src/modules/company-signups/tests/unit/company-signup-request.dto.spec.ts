import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateCompanySignupRequestDto } from "../../presentation/dto/company-signup-request.dto";

const validPayload = {
  adminEmail: "owner@example.com",
  adminFirstName: "Ana",
  adminLastName: "Owner",
  companyName: "Acme Corp",
  companySize: "11-50",
  country: "BO",
  desiredTenantSlug: "acme-corp",
  preferredLanguage: "es",
  timezone: "America/La_Paz"
};

describe("CreateCompanySignupRequestDto", () => {
  it("accepts a valid signup request payload", async () => {
    const dto = plainToInstance(CreateCompanySignupRequestDto, validPayload);

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it("requires company size, timezone, and preferred language", async () => {
    const dto = plainToInstance(CreateCompanySignupRequestDto, {
      ...validPayload,
      companySize: undefined,
      preferredLanguage: undefined,
      timezone: undefined
    });

    const errors = await validate(dto);
    const fieldsWithErrors = errors.map((error) => error.property);

    expect(fieldsWithErrors).toEqual(expect.arrayContaining(["companySize", "preferredLanguage", "timezone"]));
  });

  it("rejects unsupported company size, invalid country, and invalid timezone", async () => {
    const dto = plainToInstance(CreateCompanySignupRequestDto, {
      ...validPayload,
      companySize: "invalid",
      country: "Bolivia",
      timezone: "not-a-timezone"
    });

    const errors = await validate(dto);
    const fieldsWithErrors = errors.map((error) => error.property);

    expect(fieldsWithErrors).toEqual(expect.arrayContaining(["companySize", "country", "timezone"]));
  });
});
