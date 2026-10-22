-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "loginBlockedUntil" TIMESTAMP(3),
ADD COLUMN     "loginFailures" INTEGER NOT NULL DEFAULT 0;
