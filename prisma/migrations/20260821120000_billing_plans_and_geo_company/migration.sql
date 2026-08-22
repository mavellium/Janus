-- CreateEnum
CREATE TYPE "plan_tier" AS ENUM ('TRIAL', 'INICIAL', 'MEDIO', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "tier" "plan_tier" NOT NULL DEFAULT 'TRIAL',
    "status" "subscription_status" NOT NULL DEFAULT 'TRIALING',
    "trial_ends_at" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "discount_percent" INTEGER,
    "discount_ends_at" TIMESTAMP(3),
    "limit_overrides" JSONB NOT NULL DEFAULT '{}',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_company_id_key" ON "subscriptions"("company_id");

-- CreateIndex
CREATE INDEX "subscriptions_tier_idx" ON "subscriptions"("tier");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_trial_ends_at_idx" ON "subscriptions"("trial_ends_at");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "geo_target_profiles" ADD COLUMN     "company_id" UUID;

-- CreateIndex
CREATE INDEX "geo_target_profiles_company_id_idx" ON "geo_target_profiles"("company_id");

-- AddForeignKey
ALTER TABLE "geo_target_profiles" ADD CONSTRAINT "geo_target_profiles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: empresas que já existiam antes dos planos entram como ENTERPRISE/ACTIVE.
-- Foram vendidas sem limite contratado; rebaixá-las automaticamente bloquearia uso legítimo.
-- O admin ajusta o plano real de cada uma pelo painel (/dashboard-admin/companies).
INSERT INTO "subscriptions" ("id", "company_id", "tier", "status", "limit_overrides", "created_at", "updated_at")
SELECT gen_random_uuid(), "id", 'ENTERPRISE', 'ACTIVE', '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "companies"
WHERE "deleted_at" IS NULL;
