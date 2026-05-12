import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { SKIP_TENANT_KEY } from "../decorators/skip-tenant.decorator";
import type { RequestWithContext } from "../types/request-context";
import { ResolveTenantContextUseCase } from "../../modules/identity/application/use-cases/resolve-tenant-context.use-case";

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly resolveTenantContextUseCase: ResolveTenantContextUseCase
  ) {}

  canActivate = async (context: ExecutionContext): Promise<boolean> => {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (isPublic) {
      return true;
    }

    const skipTenant = this.reflector.getAllAndOverride<boolean>(SKIP_TENANT_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (skipTenant) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithContext>();

    if (!request.user) {
      throw new UnauthorizedException("Authenticated user was not resolved.");
    }

    const tenantSlug = this.resolveTenantSlug(request);

    if (!tenantSlug) {
      throw new ForbiddenException("Missing tenant context.");
    }

    request.tenant = await this.resolveTenantContextUseCase.execute({
      userId: request.user.id,
      tenantSlug
    });

    return true;
  };

  private resolveTenantSlug = (request: RequestWithContext): string | undefined => {
    const tenantHeader = request.headers["x-tenant-slug"];

    if (Array.isArray(tenantHeader)) {
      return tenantHeader[0];
    }

    return tenantHeader;
  };
}
