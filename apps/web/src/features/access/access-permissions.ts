export const accessPermissions = {
  viewAccess: ["users.read", "users.manage", "roles.manage"],
  viewUsers: ["users.read", "users.manage"],
  manageUsers: ["users.manage"],
  viewRoles: ["roles.manage"],
  manageRoles: ["roles.manage"],
  viewInvitations: ["users.read", "users.manage"],
  manageInvitations: ["users.manage"]
} as const;

export const hasAnyAccessPermission = (
  userPermissions: readonly string[],
  requiredPermissions: readonly string[]
) => requiredPermissions.some((permission) => userPermissions.includes(permission));
