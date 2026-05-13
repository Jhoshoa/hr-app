import type { Request } from "express";

export interface AuthenticatedUserContext {
  readonly id: string;
  readonly email: string;
  readonly name?: string;
  readonly externalAuthProvider: string;
  readonly externalAuthUserId: string;
}

export interface TenantContext {
  readonly id: string;
  readonly slug: string;
  readonly name?: string;
  readonly roleKey: string;
  readonly permissions: string[];
}

export interface RequestContext {
  user?: AuthenticatedUserContext;
  tenant?: TenantContext;
}

export type RequestWithContext = Request & RequestContext;
