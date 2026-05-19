import { describe, expect, it } from "vitest";
import { getOrganizationRecordDetail, paginateRecords } from "./organization-utils";

describe("organization utils", () => {
  it("paginates records with a stable page size", () => {
    const records = Array.from({ length: 11 }, (_, index) => ({ id: index + 1 }));

    expect(paginateRecords(records, 1).items).toHaveLength(10);
    expect(paginateRecords(records, 2).items).toEqual([{ id: 11 }]);
  });

  it("builds a compact organization record detail string", () => {
    const detail = getOrganizationRecordDetail({
      id: "location-1",
      tenantId: "tenant-1",
      name: "Cochabamba HQ",
      status: "ACTIVE",
      country: "BO",
      subdivisionCode: "BO-C",
      city: "Cochabamba",
      timezone: "America/La_Paz",
      createdAt: "2026-05-13T10:00:00.000Z",
      updatedAt: "2026-05-13T10:00:00.000Z"
    });

    expect(detail).toBe("Cochabamba, BO-C, BO | America/La_Paz");
  });
});
