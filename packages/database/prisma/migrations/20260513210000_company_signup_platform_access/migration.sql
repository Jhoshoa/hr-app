-- CreateEnum
CREATE TYPE "CompanySignupStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PlatformRoleKey" AS ENUM ('PLATFORM_OWNER', 'PLATFORM_ADMIN', 'PLATFORM_SUPPORT');

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "externalAuthProvider" DROP NOT NULL,
ALTER COLUMN "externalAuthProvider" DROP DEFAULT,
ALTER COLUMN "externalAuthUserId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "PlatformUserRole" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "roleKey" "PlatformRoleKey" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformUserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanySignupRequest" (
    "id" UUID NOT NULL,
    "companyName" TEXT NOT NULL,
    "desiredTenantSlug" TEXT NOT NULL,
    "adminFirstName" TEXT NOT NULL,
    "adminLastName" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "companyWebsite" TEXT,
    "companySize" TEXT,
    "country" TEXT,
    "timezone" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'es',
    "phone" TEXT,
    "message" TEXT,
    "status" "CompanySignupStatus" NOT NULL DEFAULT 'PENDING',
    "approvedTenantId" UUID,
    "reviewedByUserId" UUID,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySignupRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlatformUserRole_roleKey_idx" ON "PlatformUserRole"("roleKey");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformUserRole_userId_roleKey_key" ON "PlatformUserRole"("userId", "roleKey");

-- CreateIndex
CREATE INDEX "CompanySignupRequest_status_createdAt_idx" ON "CompanySignupRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CompanySignupRequest_adminEmail_idx" ON "CompanySignupRequest"("adminEmail");

-- CreateIndex
CREATE INDEX "CompanySignupRequest_desiredTenantSlug_idx" ON "CompanySignupRequest"("desiredTenantSlug");

-- AddForeignKey
ALTER TABLE "PlatformUserRole" ADD CONSTRAINT "PlatformUserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanySignupRequest" ADD CONSTRAINT "CompanySignupRequest_approvedTenantId_fkey" FOREIGN KEY ("approvedTenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanySignupRequest" ADD CONSTRAINT "CompanySignupRequest_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
