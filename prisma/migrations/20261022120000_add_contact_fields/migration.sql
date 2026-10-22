-- AlterTable
ALTER TABLE "Idea" ADD COLUMN     "contactCompany" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "contactRole" TEXT;

-- Reprise de l'ancien champ "Destinataire" : une adresse email va dans
-- contactEmail, tout autre texte (un nom) dans contactName. emailRecipient
-- n'est ni vidé ni supprimé.
UPDATE "Idea"
SET "contactEmail" = trim("emailRecipient")
WHERE trim("emailRecipient") ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$';

UPDATE "Idea"
SET "contactName" = trim("emailRecipient")
WHERE "emailRecipient" IS NOT NULL
  AND trim("emailRecipient") <> ''
  AND "contactEmail" IS NULL;
