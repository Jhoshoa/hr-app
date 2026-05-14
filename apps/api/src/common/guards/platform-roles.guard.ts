import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { PlatformRoleKey } from "@prisma/client";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { REQUIRED_PLATFORM_ROLES_KEY } from "../decorators/platform-roles.decorator";
import type { RequestWithContext } from "../types/request-context";

@Injectable()
export class PlatformRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate = (context: ExecutionContext): boolean => {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<PlatformRoleKey[]>(
      REQUIRED_PLATFORM_ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithContext>();

    if (!request.user) {
      throw new UnauthorizedException("Authenticated user was not resolved.");
    }

    const hasRequiredRole = requiredRoles.some((role) =>
      request.user?.platformRoles.includes(role)
    );

    if (!hasRequiredRole) {
      throw new ForbiddenException("Missing required platform role.");
    }

    return true;
  };
}
