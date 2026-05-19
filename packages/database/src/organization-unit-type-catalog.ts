export const organizationUnitTypeCatalog = [
  {
    key: "branch",
    name: "Branch",
    sortOrder: 10
  },
  {
    key: "office",
    name: "Office",
    sortOrder: 20
  },
  {
    key: "subsidiary",
    name: "Subsidiary",
    sortOrder: 30
  },
  {
    key: "business_unit",
    name: "Business Unit",
    sortOrder: 40
  }
] as const;

export type OrganizationUnitTypeCatalogEntry = (typeof organizationUnitTypeCatalog)[number];
