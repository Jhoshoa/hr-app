import { describe, expect, it } from "vitest";
import { hasAllFeatures, hasAnyFeature, hasFeature } from "./features";

describe("feature helpers", () => {
  it("checks a single feature", () => {
    expect(hasFeature(["timesheets"], "timesheets")).toBe(true);
    expect(hasFeature([], "timesheets")).toBe(false);
  });

  it("checks all required features", () => {
    expect(hasAllFeatures(["timesheets", "documents"], ["timesheets"])).toBe(true);
    expect(hasAllFeatures(["timesheets"], ["timesheets", "documents"])).toBe(false);
  });

  it("treats an empty any-feature requirement as allowed", () => {
    expect(hasAnyFeature([], [])).toBe(true);
    expect(hasAnyFeature(["documents"], ["timesheets", "documents"])).toBe(true);
  });
});
