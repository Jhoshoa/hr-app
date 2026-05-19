-- CreateTable
CREATE TABLE "OrganizationUnitType" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationUnitType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationUnit" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "parentOrganizationUnitId" UUID,
    "typeId" UUID NOT NULL,
    "primaryLocationId" UUID,
    "key" TEXT,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "code" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationUnit_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "EmployeeJobAssignment" ADD COLUMN "organizationUnitId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationUnitType_tenantId_key_key" ON "OrganizationUnitType"("tenantId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationUnitType_tenantId_name_key" ON "OrganizationUnitType"("tenantId", "name");

-- CreateIndex
CREATE INDEX "OrganizationUnitType_tenantId_status_idx" ON "OrganizationUnitType"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationUnit_tenantId_name_key" ON "OrganizationUnit"("tenantId", "name");

-- CreateIndex
CREATE INDEX "OrganizationUnit_tenantId_status_idx" ON "OrganizationUnit"("tenantId", "status");

-- CreateIndex
CREATE INDEX "OrganizationUnit_tenantId_typeId_idx" ON "OrganizationUnit"("tenantId", "typeId");

-- CreateIndex
CREATE INDEX "OrganizationUnit_tenantId_parentOrganizationUnitId_idx" ON "OrganizationUnit"("tenantId", "parentOrganizationUnitId");

-- CreateIndex
CREATE INDEX "OrganizationUnit_tenantId_primaryLocationId_idx" ON "OrganizationUnit"("tenantId", "primaryLocationId");

-- CreateIndex
CREATE INDEX "OrganizationUnit_tenantId_key_idx" ON "OrganizationUnit"("tenantId", "key");

-- CreateIndex
CREATE INDEX "OrganizationUnit_tenantId_code_idx" ON "OrganizationUnit"("tenantId", "code");

-- CreateIndex
CREATE INDEX "EmployeeJobAssignment_tenantId_organizationUnitId_idx" ON "EmployeeJobAssignment"("tenantId", "organizationUnitId");

-- AddForeignKey
ALTER TABLE "OrganizationUnitType" ADD CONSTRAINT "OrganizationUnitType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationUnit" ADD CONSTRAINT "OrganizationUnit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationUnit" ADD CONSTRAINT "OrganizationUnit_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "OrganizationUnitType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationUnit" ADD CONSTRAINT "OrganizationUnit_parentOrganizationUnitId_fkey" FOREIGN KEY ("parentOrganizationUnitId") REFERENCES "OrganizationUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationUnit" ADD CONSTRAINT "OrganizationUnit_primaryLocationId_fkey" FOREIGN KEY ("primaryLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeJobAssignment" ADD CONSTRAINT "EmployeeJobAssignment_organizationUnitId_fkey" FOREIGN KEY ("organizationUnitId") REFERENCES "OrganizationUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
