export const devAuthSeedPassword = process.env.DEV_AUTH_SEED_PASSWORD?.trim() || "Password123!";

export const devSeedUsers = {
  platformOwner: {
    email: "platform.owner@example.test",
    name: "Platform Owner"
  },
  demoTenantAdmin: {
    email: "demo.owner@example.test",
    name: "Demo Tenant Owner"
  },
  secondaryTenantAdmin: {
    email: "secondary.owner@example.test",
    name: "Secondary Tenant Owner"
  },
  pendingSignupAdmin: {
    email: "pending.signup@example.test",
    firstName: "Pending",
    lastName: "Requester"
  }
} as const;

export const devAuthLoginUsers = [
  devSeedUsers.platformOwner,
  devSeedUsers.demoTenantAdmin,
  devSeedUsers.secondaryTenantAdmin
] as const;
