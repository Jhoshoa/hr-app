import { SetMetadata } from "@nestjs/common";
import type { PlatformRoleKey } from "@prisma/client";

export const REQUIRED_PLATFORM_ROLES_KEY = "requiredPlatformRoles";

export const PlatformRoles = (...roles: PlatformRoleKey[]) =>
  SetMetadata(REQUIRED_PLATFORM_ROLES_KEY, roles);
