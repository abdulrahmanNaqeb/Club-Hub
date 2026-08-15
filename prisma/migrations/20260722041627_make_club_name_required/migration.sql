/*
  Warnings:

  - Made the column `name` on table `Club` required. This step will fail if there are existing NULL values in that column.

*/
-- Backfill NULL Club.name values with a non-null fallback to satisfy the NOT NULL constraint
UPDATE "Club" SET "name" = 'Untitled club' WHERE "name" IS NULL;

-- AlterTable
ALTER TABLE "Club" ALTER COLUMN "name" SET NOT NULL;
