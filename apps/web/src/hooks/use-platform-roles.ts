import type { PlatformRoleKey } from "@/types/identity";
import { useAppSelector } from "@/store/hooks";

export const usePlatformRoles = () => useAppSelector((state) => state.auth.platformRoles);

export const hasAnyPlatformRole = (
  platformRoles: readonly PlatformRoleKey[],
  requiredRoles: readonly PlatformRoleKey[]
) => requiredRoles.length === 0 || requiredRoles.some((role) => platformRoles.includes(role));
