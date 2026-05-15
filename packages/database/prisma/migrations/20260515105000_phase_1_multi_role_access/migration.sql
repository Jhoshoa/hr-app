-- CreateEnum
CREATE TYPE "TenantInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'CANCELLED', 'EXPIRED');

-- AlterTable
ALTER TABLE "Role" ADD COLUMN "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Permission" ADD COLUMN "module" TEXT,
ADD COLUMN "action" TEXT,
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "isCritical" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "TenantMembershipRole" (
    "membershipId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantMembershipRole_pkey" PRIMARY KEY ("membershipId","roleId")
);

-- Backfill current single-role memberships into the multi-role join table.
INSERT INTO "TenantMembershipRole" ("membershipId", "roleId")
SELECT "id", "roleId"
FROM "TenantMembership"
ON CONFLICT ("membershipId", "roleId") DO NOTHING;

-- CreateTable
CREATE TABLE "TenantInvitation" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "membershipId" UUID,
    "status" "TenantInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "tokenHash" TEXT NOT NULL,
    "invitedByUserId" UUID,
    "acceptedByUserId" UUID,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantInvitationRole" (
    "invitationId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantInvitationRole_pkey" PRIMARY KEY ("invitationId","roleId")
);

-- CreateIndex
CREATE INDEX "Role_tenantId_status_idx" ON "Role"("tenantId", "status");

-- CreateIndex
CREATE INDEX "TenantMembershipRole_roleId_idx" ON "TenantMembershipRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantInvitation_tokenHash_key" ON "TenantInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "TenantInvitation_tenantId_status_createdAt_idx" ON "TenantInvitation"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "TenantInvitation_tenantId_email_idx" ON "TenantInvitation"("tenantId", "email");

-- CreateIndex
CREATE INDEX "TenantInvitationRole_roleId_idx" ON "TenantInvitationRole"("roleId");

-- AddForeignKey
ALTER TABLE "TenantMembershipRole" ADD CONSTRAINT "TenantMembershipRole_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "TenantMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantMembershipRole" ADD CONSTRAINT "TenantMembershipRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantInvitation" ADD CONSTRAINT "TenantInvitation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantInvitation" ADD CONSTRAINT "TenantInvitation_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "TenantMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantInvitation" ADD CONSTRAINT "TenantInvitation_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantInvitation" ADD CONSTRAINT "TenantInvitation_acceptedByUserId_fkey" FOREIGN KEY ("acceptedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantInvitationRole" ADD CONSTRAINT "TenantInvitationRole_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "TenantInvitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantInvitationRole" ADD CONSTRAINT "TenantInvitationRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
