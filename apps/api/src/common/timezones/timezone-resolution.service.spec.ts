import { TimezoneResolutionService } from "./timezone-resolution.service";

describe("TimezoneResolutionService", () => {
  const service = new TimezoneResolutionService();

  it("resolves tenant default with a USA-first fallback", () => {
    expect(service.resolveTenantDefault({ timezone: "America/Los_Angeles" })).toBe("America/Los_Angeles");
    expect(service.resolveTenantDefault({ timezone: "not-a-timezone" })).toBe("America/New_York");
    expect(service.resolveTenantDefault(null)).toBe("America/New_York");
  });

  it("prefers location timezone for operational location context", () => {
    expect(
      service.resolveLocationOperational({
        tenant: { timezone: "America/Chicago" },
        location: { timezone: "America/Phoenix" }
      })
    ).toBe("America/Phoenix");
  });

  it("falls back from employee to current location and tenant", () => {
    expect(
      service.resolveEmployeeOperational({
        tenant: { timezone: "America/Chicago" },
        employee: { currentLocation: { timezone: "America/Denver" } }
      })
    ).toBe("America/Denver");

    expect(
      service.resolveEmployeeOperational({
        tenant: { timezone: "America/Chicago" },
        employee: { timezone: "America/Los_Angeles", currentLocation: { timezone: "America/Denver" } }
      })
    ).toBe("America/Los_Angeles");
  });
});
