import { SetMetadata } from "@nestjs/common";

export const REQUIRED_FEATURES_KEY = "requiredFeatures";

export const RequireFeature = (...features: string[]): MethodDecorator & ClassDecorator =>
  SetMetadata(REQUIRED_FEATURES_KEY, features);
