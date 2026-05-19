import { ForbiddenException, Injectable } from "@nestjs/common";
import type { TenantContext } from "../types/request-context";

@Injectable()
export class TenantFeatureService {
  hasFeature = (tenant: TenantContext, featureKey: string): boolean =>
    tenant.features.includes(featureKey);

  assertFeatureEnabled = (tenant: TenantContext, featureKey: string): void => {
    if (!this.hasFeature(tenant, featureKey)) {
      throw new ForbiddenException("Feature is not enabled for this tenant.");
    }
  };
}
