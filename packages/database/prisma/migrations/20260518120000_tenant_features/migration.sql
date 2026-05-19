-- CreateTable
CREATE TABLE "TenantFeature" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantFeature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TenantFeature_tenantId_key_key" ON "TenantFeature"("tenantId", "key");

-- CreateIndex
CREATE INDEX "TenantFeature_tenantId_enabled_idx" ON "TenantFeature"("tenantId", "enabled");

-- CreateIndex
CREATE INDEX "TenantFeature_key_enabled_idx" ON "TenantFeature"("key", "enabled");

-- AddForeignKey
ALTER TABLE "TenantFeature" ADD CONSTRAINT "TenantFeature_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
