-- CreateTable
CREATE TABLE "IdeaNote" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ideaId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'voice',
    CONSTRAINT "IdeaNote_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "IdeaNote_ideaId_createdAt_idx" ON "IdeaNote"("ideaId", "createdAt");
-- AddForeignKey
ALTER TABLE "IdeaNote" ADD CONSTRAINT "IdeaNote_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
