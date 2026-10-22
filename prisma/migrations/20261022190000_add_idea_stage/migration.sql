-- CreateEnum
CREATE TYPE "IdeaStage" AS ENUM ('NEW', 'THINKING', 'IN_PROGRESS', 'DONE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Idea" ADD COLUMN     "stage" "IdeaStage" NOT NULL DEFAULT 'NEW';

-- Reprise : une idée déjà marquée « faite » devient « Réalisée ».
-- Aucune autre donnée n'est modifiée (status reste tel quel).
UPDATE "Idea" SET "stage" = 'DONE' WHERE "status" = 'ACTIONED';
