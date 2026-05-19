import { BadRequestException } from "@nestjs/common";
import { TimezonePolicyService } from "./timezone-policy.service";

describe("TimezonePolicyService", () => {
  it("accepts supported product timezones", () => {
    const service = new TimezonePolicyService();

    expect(service.assertSupported("America/La_Paz")).toBe("America/La_Paz");
    expect(service.assertSupported(" America/New_York ")).toBe("America/New_York");
  });

  it("rejects IANA timezones outside the supported product catalog", () => {
    const service = new TimezonePolicyService();

    expect(() => service.assertSupported("Europe/Madrid")).toThrow(BadRequestException);
  });
});
