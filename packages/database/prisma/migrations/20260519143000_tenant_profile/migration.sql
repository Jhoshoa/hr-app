CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "TenantProfile" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "website" TEXT,
  "companySize" TEXT,
  "country" TEXT,
  "phone" TEXT,
  "contactEmail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TenantProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TenantProfile_tenantId_key" ON "TenantProfile"("tenantId");
CREATE INDEX "TenantProfile_country_idx" ON "TenantProfile"("country");

ALTER TABLE "TenantProfile"
ADD CONSTRAINT "TenantProfile_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "TenantProfile" (
  "id",
  "tenantId",
  "website",
  "companySize",
  "country",
  "phone",
  "contactEmail",
  "createdAt",
  "updatedAt"
)
SELECT DISTINCT ON ("approvedTenantId")
  gen_random_uuid(),
  "approvedTenantId",
  "companyWebsite",
  "companySize",
  "country",
  "phone",
  "adminEmail",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "CompanySignupRequest"
WHERE "approvedTenantId" IS NOT NULL
ORDER BY "approvedTenantId", "reviewedAt" DESC NULLS LAST, "updatedAt" DESC
ON CONFLICT ("tenantId") DO NOTHING;
