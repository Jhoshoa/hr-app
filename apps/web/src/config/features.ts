export const hasFeature = (features: readonly string[], feature: string) =>
  features.includes(feature);

export const hasAllFeatures = (features: readonly string[], required: readonly string[]) =>
  required.every((feature) => features.includes(feature));

export const hasAnyFeature = (features: readonly string[], required: readonly string[]) =>
  required.length === 0 || required.some((feature) => features.includes(feature));
