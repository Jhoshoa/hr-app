export interface PermissionCatalogEntry {
  readonly key: string;
  readonly description: string;
  readonly module: string;
  readonly action: string;
  readonly sortOrder: number;
  readonly isCritical?: boolean;
}

export const permissionCatalog = [
  {
    key: "tenant.read",
    description: "Read tenant information",
    module: "Tenant",
    action: "Read",
    sortOrder: 10
  },
  {
    key: "tenant.manage",
    description: "Manage tenant settings",
    module: "Tenant",
    action: "Manage",
    sortOrder: 20,
    isCritical: true
  },
  {
    key: "users.read",
    description: "Read users",
    module: "Users",
    action: "Read",
    sortOrder: 30
  },
  {
    key: "users.manage",
    description: "Manage users and invitations",
    module: "Users",
    action: "Manage",
    sortOrder: 40,
    isCritical: true
  },
  {
    key: "roles.manage",
    description: "Manage roles and permissions",
    module: "Roles",
    action: "Manage",
    sortOrder: 50,
    isCritical: true
  },
  {
    key: "audit.read",
    description: "Read audit events",
    module: "Audit",
    action: "Read",
    sortOrder: 60
  },
  {
    key: "organization.read",
    description: "Read organization setup records",
    module: "Organization",
    action: "Read",
    sortOrder: 70
  },
  {
    key: "organization.manage",
    description: "Manage organization setup records",
    module: "Organization",
    action: "Manage",
    sortOrder: 80
  },
  {
    key: "employees.read",
    description: "Read employee directory and profiles",
    module: "Employees",
    action: "Read",
    sortOrder: 90
  },
  {
    key: "employees.self.read",
    description: "Read own employee profile",
    module: "Employees",
    action: "Read self",
    sortOrder: 100
  },
  {
    key: "employees.team.read",
    description: "Read direct report employee profiles",
    module: "Employees",
    action: "Read team",
    sortOrder: 110
  },
  {
    key: "employees.manage",
    description: "Manage employee profiles and job data",
    module: "Employees",
    action: "Manage",
    sortOrder: 120
  },
  {
    key: "employees.compensation.read",
    description: "Read employee compensation records",
    module: "Compensation",
    action: "Read",
    sortOrder: 130,
    isCritical: true
  },
  {
    key: "employees.compensation.manage",
    description: "Manage employee compensation records",
    module: "Compensation",
    action: "Manage",
    sortOrder: 140,
    isCritical: true
  },
  {
    key: "employees.custom-fields.manage",
    description: "Manage employee custom field definitions",
    module: "Employees",
    action: "Manage custom fields",
    sortOrder: 150
  }
] as const satisfies readonly PermissionCatalogEntry[];

export type PermissionKey = (typeof permissionCatalog)[number]["key"];

