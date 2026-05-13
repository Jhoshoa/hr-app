export const hasPermission = (permissions: readonly string[], permission: string) =>
  permissions.includes(permission);

export const hasAnyPermission = (permissions: readonly string[], required: readonly string[]) =>
  required.length === 0 || required.some((permission) => permissions.includes(permission));
