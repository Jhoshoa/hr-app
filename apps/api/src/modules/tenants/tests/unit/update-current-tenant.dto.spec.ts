import { BadRequestException, ValidationPipe } from "@nestjs/common";
import { UpdateCurrentTenantDto } from "../../presentation/dto/update-current-tenant.dto";

const createValidationPipe = () =>
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  });

describe("UpdateCurrentTenantDto", () => {
  it("allows editable company profile fields", async () => {
    const result = await createValidationPipe().transform(
      {
        profile: {
          website: "example.com",
          companySize: "11-50",
          country: "BO",
          phone: "+59170000000"
        }
      },
      { type: "body", metatype: UpdateCurrentTenantDto }
    );

    expect(result).toEqual({
      profile: {
        website: "example.com",
        companySize: "11-50",
        country: "BO",
        phone: "+59170000000"
      }
    });
  });

  it("rejects contactEmail updates from company settings", async () => {
    await expect(
      createValidationPipe().transform(
        {
          profile: {
            contactEmail: "new-owner@example.com"
          }
        },
        { type: "body", metatype: UpdateCurrentTenantDto }
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects slug updates from company settings", async () => {
    await expect(
      createValidationPipe().transform(
        {
          slug: "new-workspace-slug"
        },
        { type: "body", metatype: UpdateCurrentTenantDto }
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
