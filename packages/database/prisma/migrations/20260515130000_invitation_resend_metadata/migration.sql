-- AlterTable
ALTER TABLE "TenantInvitation" ADD COLUMN "resendCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lastSentAt" TIMESTAMP(3);

-- Backfill lastSentAt for existing invitations created before resend metadata.
UPDATE "TenantInvitation"
SET "lastSentAt" = "createdAt"
WHERE "lastSentAt" IS NULL;
