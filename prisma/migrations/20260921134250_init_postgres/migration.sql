-- CreateEnum
CREATE TYPE "IdeaCategory" AS ENUM ('PROJET', 'EMAIL', 'APPEL_RAPPEL', 'IDEE_PURE');

-- CreateEnum
CREATE TYPE "IdeaStatus" AS ENUM ('PENDING', 'ACTIONED');

-- CreateEnum
CREATE TYPE "IdeaPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "Idea" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "IdeaStatus" NOT NULL DEFAULT 'PENDING',
    "category" "IdeaCategory" NOT NULL,
    "priority" "IdeaPriority" NOT NULL DEFAULT 'MEDIUM',
    "transcript" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "emailRecipient" TEXT,
    "emailSubject" TEXT,
    "emailBody" TEXT,
    "dueAt" TIMESTAMP(3),
    "dueEstimated" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "notionPageId" TEXT,
    "notionPageUrl" TEXT,

    CONSTRAINT "Idea_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Idea"("id") ON DELETE SET NULL ON UPDATE CASCADE;
