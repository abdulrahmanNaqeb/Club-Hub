-- Add idempotency support for funding requests
ALTER TABLE "FundingRequest" ADD COLUMN "idempotencyKey" text;
CREATE UNIQUE INDEX "FundingRequest_clubId_idempotencyKey_unique" ON "FundingRequest" ("clubId", "idempotencyKey");
