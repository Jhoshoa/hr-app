import { SetMetadata } from "@nestjs/common";

export const REQUIRED_PLATFORM_ROLES_KEY = "requiredPlatformRoles";

export const PlatformRoles = (...roles: string[]) =>
  SetMetadata(REQUIRED_PLATFORM_ROLES_KEY, roles);
