import type { OrganizationRecord } from "./organization-types";

export const ORGANIZATION_PAGE_SIZE = 10;

export const paginateRecords = <T>(records: readonly T[], page: number, pageSize = ORGANIZATION_PAGE_SIZE) => {
  const totalPages = Math.max(1, Math.ceil(records.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: records.slice(start, start + pageSize),
    page: safePage,
    totalPages
  };
};

export const getOrganizationRecordDetail = (record: OrganizationRecord) => {
  const details = [
    record.parentDepartmentId ? `Parent: ${record.parentDepartmentId}` : null,
    [record.city, record.country].filter(Boolean).join(", "),
    record.timezone,
    record.level,
    record.category,
    record.type,
    record.code ? `Code: ${record.code}` : null
  ].filter(Boolean);

  return details.length > 0 ? details.join(" | ") : "No additional details";
};
