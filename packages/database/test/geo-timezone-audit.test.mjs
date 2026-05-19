import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { auditGeoTimezoneData } from "../dist/index.js";

describe("auditGeoTimezoneData", () => {
  it("returns an empty report for clean geo/timezone data", () => {
    const report = auditGeoTimezoneData({
      tenants: [{ id: "tenant-1", timezone: "America/New_York" }],
      locations: [
        {
          id: "location-1",
          tenantId: "tenant-1",
          country: "US",
          subdivisionCode: "US-NY",
          timezone: "America/New_York"
        }
      ],
      companySignupRequests: [
        {
          id: "signup-1",
          country: "BO",
          phone: "+59170000000",
          timezone: "America/La_Paz"
        }
      ]
    });

    assert.deepEqual(report.summary, { totalFindings: 0, errors: 0, warnings: 0 });
    assert.deepEqual(report.findings, []);
  });

  it("reports blocking tenant and location errors", () => {
    const report = auditGeoTimezoneData({
      tenants: [{ id: "tenant-1", timezone: "Europe/Madrid" }],
      locations: [
        {
          id: "location-1",
          tenantId: "tenant-1",
          country: "Spain",
          subdivisionCode: null,
          timezone: null
        }
      ],
      companySignupRequests: []
    });

    assert.equal(report.summary.errors, 3);
    assert.deepEqual(
      report.findings.map((finding) => `${finding.resource}.${finding.field}`),
      ["Tenant.timezone", "Location.country", "Location.timezone"]
    );
  });

  it("reports reviewable signup and subdivision warnings", () => {
    const report = auditGeoTimezoneData({
      tenants: [],
      locations: [
        {
          id: "location-1",
          tenantId: "tenant-1",
          country: "BO",
          subdivisionCode: "US-NY",
          timezone: "America/La_Paz"
        }
      ],
      companySignupRequests: [
        {
          id: "signup-1",
          country: "BO",
          phone: "+15550100",
          timezone: "Europe/Madrid"
        }
      ]
    });

    assert.equal(report.summary.errors, 0);
    assert.equal(report.summary.warnings, 3);
    assert.deepEqual(
      report.findings.map((finding) => `${finding.resource}.${finding.field}`),
      [
        "Location.subdivisionCode",
        "CompanySignupRequest.timezone",
        "CompanySignupRequest.phone"
      ]
    );
  });
});
