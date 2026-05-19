import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getCallingCodeOptions,
  getCountryByCode,
  getCountryCodeForTimeZone,
  getCountryDefaultCallingCode,
  getCountryDefaultTimeZone,
  getCountrySubdivisions,
  getCountryOptions,
  getSubdivisionOptions,
  isSupportedCallingCode,
  normalizeSubdivisionCode,
  normalizeCountryCode,
  normalizePhoneNumber
} from "../dist/index.js";

describe("@hr-app/geo", () => {
  it("normalizes supported country codes and legacy country names", () => {
    assert.equal(normalizeCountryCode("bo"), "BO");
    assert.equal(normalizeCountryCode("Bolivia"), "BO");
    assert.equal(normalizeCountryCode("ZZ"), null);
  });

  it("exposes country options and generated flag metadata", () => {
    assert.deepEqual(getCountryOptions()[0], { value: "BO", label: "Bolivia" });
    assert.equal(getCountryByCode("BO")?.flagEmoji, "\u{1F1E7}\u{1F1F4}");
  });

  it("resolves timezone defaults and country from timezone", () => {
    assert.equal(getCountryDefaultTimeZone("BO"), "America/La_Paz");
    assert.equal(getCountryCodeForTimeZone("America/New_York"), "US");
    assert.equal(getCountryCodeForTimeZone("Europe/Madrid"), null);
  });

  it("normalizes phone numbers with supported calling codes", () => {
    assert.equal(getCountryDefaultCallingCode("BO"), "+591");
    assert.equal(isSupportedCallingCode("+591"), true);
    assert.equal(normalizePhoneNumber("70000000", "BO"), "+59170000000");
    assert.equal(normalizePhoneNumber("+1 555 0100", "BO"), "+15550100");
    assert.equal(normalizePhoneNumber("+34 600 000 000", "BO"), null);
  });

  it("returns calling code options with flag labels", () => {
    assert.equal(getCallingCodeOptions()[0]?.label, "\u{1F1E7}\u{1F1F4} +591");
  });

  it("resolves subdivision catalogs by country", () => {
    assert.equal(getCountrySubdivisions("BO").length, 9);
    assert.deepEqual(getSubdivisionOptions("BO")[1], { value: "BO-C", label: "Cochabamba" });
    assert.equal(normalizeSubdivisionCode("BO", "bo-c"), "BO-C");
    assert.equal(normalizeSubdivisionCode("US", "BO-C"), null);
  });
});
