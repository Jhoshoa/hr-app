import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_TIME_ZONE,
  formatDateInTimeZone,
  formatDateTimeInTimeZone,
  getAmericaTimeZoneOptions,
  isSupportedTimeZone,
  resolveDisplayTimeZone,
  resolveEmployeeOperationalTimeZone,
  resolveLocationOperationalTimeZone,
  resolveTenantDefaultTimeZone
} from "../dist/index.js";

test("uses a USA-first default timezone", () => {
  assert.equal(DEFAULT_TIME_ZONE, "America/New_York");
  assert.equal(isSupportedTimeZone(DEFAULT_TIME_ZONE), true);
});

test("includes key USA operational timezones", () => {
  const values = new Set(getAmericaTimeZoneOptions().map((option) => option.value));

  assert.equal(values.has("America/New_York"), true);
  assert.equal(values.has("America/Chicago"), true);
  assert.equal(values.has("America/Denver"), true);
  assert.equal(values.has("America/Phoenix"), true);
  assert.equal(values.has("America/Los_Angeles"), true);
  assert.equal(values.has("America/Anchorage"), true);
  assert.equal(values.has("Pacific/Honolulu"), true);
});

test("resolves tenant, location, employee, and display timezone priority", () => {
  assert.equal(resolveTenantDefaultTimeZone({ timezone: "America/Los_Angeles" }), "America/Los_Angeles");
  assert.equal(resolveTenantDefaultTimeZone({ timezone: "not-a-timezone" }), "America/New_York");
  assert.equal(
    resolveLocationOperationalTimeZone({
      tenant: { timezone: "America/Chicago" },
      location: { timezone: "America/Phoenix" }
    }),
    "America/Phoenix"
  );
  assert.equal(
    resolveEmployeeOperationalTimeZone({
      tenant: { timezone: "America/Chicago" },
      employee: { currentLocation: { timezone: "America/Denver" } }
    }),
    "America/Denver"
  );
  assert.equal(
    resolveDisplayTimeZone({
      tenant: { timezone: "America/Chicago" },
      userTimezone: "America/Los_Angeles",
      contextLocation: { timezone: "America/New_York" }
    }),
    "America/Los_Angeles"
  );
});

test("formats dates with explicit timezone", () => {
  const value = "2026-01-01T04:30:00.000Z";

  assert.equal(
    formatDateInTimeZone(value, { locale: "en-US", timeZone: "America/Los_Angeles" }),
    "Dec 31, 2025"
  );
  assert.match(
    formatDateTimeInTimeZone(value, { locale: "en-US", timeZone: "America/New_York" }),
    /Dec 31, 2025/
  );
});
