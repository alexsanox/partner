-- Migration: trial_free_services
-- Adds trial/free service support and idle-shutdown tracking

-- Make orderId optional on services
ALTER TABLE "services" ALTER COLUMN "orderId" DROP NOT NULL;

-- Add trial/free fields to services
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "isTrial" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "isFree" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "idleEmptySince" TIMESTAMP(3);

-- Add trialDays to plans (may already exist from prior schema)
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "trialDays" INTEGER NOT NULL DEFAULT 0;
