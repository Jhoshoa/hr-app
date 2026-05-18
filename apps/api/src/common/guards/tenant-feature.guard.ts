import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { REQUIRED_FEATURES_KEY } from "../decorators/require-feature.decorator";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { TenantFeatureService } from "../features/tenant-feature.service";
import type { RequestWithContext } from "../types/request-context";

@Injectable()
export class TenantFeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantFeatureService: TenantFeatureService
  ) {}

  canActivate = (context: ExecutionContext): boolean => {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (isPublic) {
      return true;
    }

    const requiredFeatures = this.reflector.getAllAndOverride<string[]>(REQUIRED_FEATURES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!requiredFeatures?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithContext>();

    if (!request.tenant) {
      throw new ForbiddenException("Tenant context is required for feature-gated endpoints.");
    }

    for (const feature of requiredFeatures) {
      this.tenantFeatureService.assertFeatureEnabled(request.tenant, feature);
    }

    return true;
  };
}
