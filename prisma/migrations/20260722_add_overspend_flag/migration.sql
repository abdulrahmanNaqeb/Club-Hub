-- CreateTable
CREATE TABLE "OverspendFlag" (
    "id" TEXT NOT NULL,
    "flaggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "clubId" TEXT NOT NULL,
    "openKey" TEXT,

    CONSTRAINT "OverspendFlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OverspendFlag_openKey_key" ON "OverspendFlag"("openKey");

-- CreateIndex
CREATE INDEX "OverspendFlag_clubId_idx" ON "OverspendFlag"("clubId");

-- AddForeignKey
ALTER TABLE "OverspendFlag" ADD CONSTRAINT "OverspendFlag_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
