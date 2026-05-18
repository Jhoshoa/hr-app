import type { Request } from "express";
import type { PlatformRoleKey } from "@prisma/client";

export interface AuthenticatedUserContext {
  readonly id: string;
  readonly email: string;
  readonly name?: string;
  readonly externalAuthProvider: string;
  readonly externalAuthUserId: string;
  readonly platformRoles: PlatformRoleKey[];
}

export interface TenantContext {
  readonly id: string;
  readonly slug: string;
  readonly name?: string;
  readonly roleKey: string;
  readonly roles?: readonly {
    readonly id: string;
    readonly key: string;
    readonly name: string;
    readonly isSystemRole: boolean;
  }[];
  readonly permissions: string[];
  readonly features: string[];
}

export interface RequestContext {
  user?: AuthenticatedUserContext;
  tenant?: TenantContext;
}

export type RequestWithContext = Request & RequestContext;
