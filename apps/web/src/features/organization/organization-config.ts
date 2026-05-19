import type { OrganizationCatalogConfig, OrganizationRecordKind } from "./organization-types";

export const organizationCatalogs: readonly OrganizationCatalogConfig[] = [
  {
    kind: "department",
    path: "departments",
    label: "Departments",
    singularLabel: "department",
    description: "Internal areas used for job assignments and reporting.",
    fields: [
      { key: "name", label: "Name", placeholder: "Engineering", required: true },
      { key: "parentDepartmentId", label: "Parent department ID", placeholder: "Optional UUID" }
    ]
  },
  {
    kind: "location",
    path: "locations",
    label: "Locations",
    singularLabel: "location",
    description: "Countries, cities, and time zones where employees work.",
    fields: [
      { key: "name", label: "Name", placeholder: "Cochabamba HQ", required: true },
      { key: "country", label: "Country", placeholder: "BO", required: true, control: "country" },
      { key: "subdivisionCode", label: "State / department", placeholder: "BO-C", control: "subdivision" },
      { key: "city", label: "City", placeholder: "Cochabamba" },
      { key: "timezone", label: "Timezone", placeholder: "America/La_Paz", required: true, control: "timezone" }
    ]
  },
  {
    kind: "jobTitle",
    path: "job-titles",
    label: "Job titles",
    singularLabel: "job title",
    description: "Standard titles and levels for employee assignments.",
    fields: [
      { key: "name", label: "Name", placeholder: "Senior Software Engineer", required: true },
      { key: "level", label: "Level", placeholder: "Senior" }
    ]
  },
  {
    kind: "employmentType",
    path: "employment-types",
    label: "Employment types",
    singularLabel: "employment type",
    description: "Contract categories used by HR and payroll workflows.",
    fields: [
      { key: "name", label: "Name", placeholder: "Full time", required: true },
      { key: "category", label: "Category", placeholder: "Permanent" }
    ]
  },
  {
    kind: "workMode",
    path: "work-modes",
    label: "Work modes",
    singularLabel: "work mode",
    description: "Remote, hybrid, and office-based work arrangements.",
    fields: [
      { key: "name", label: "Name", placeholder: "Hybrid Cochabamba", required: true },
      { key: "type", label: "Type", placeholder: "hybrid", required: true }
    ]
  },
  {
    kind: "clientProject",
    path: "client-projects",
    label: "Client projects",
    singularLabel: "client project",
    description: "Client or project assignments available to employees.",
    fields: [
      { key: "name", label: "Name", placeholder: "AssureSoft Platform", required: true },
      { key: "code", label: "Code", placeholder: "AS-PLT" }
    ]
  }
];

export const organizationCatalogByKind = organizationCatalogs.reduce(
  (catalogByKind, catalog) => ({ ...catalogByKind, [catalog.kind]: catalog }),
  {} as Record<OrganizationRecordKind, OrganizationCatalogConfig>
);
