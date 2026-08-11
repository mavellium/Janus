-- CreateEnum
CREATE TYPE "geo_question_layer" AS ENUM ('DECISAO', 'AVALIACAO', 'PROBLEMA');

-- CreateEnum
CREATE TYPE "geo_question_status" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "geo_provider" AS ENUM ('OPENAI', 'GEMINI', 'PERPLEXITY', 'CLAUDE');

-- CreateEnum
CREATE TYPE "geo_probe_mode" AS ENUM ('MODEL_MEMORY', 'LIVE_SEARCH');

-- CreateTable
CREATE TABLE "geo_target_questions" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "project_id" UUID,
    "text" TEXT NOT NULL,
    "layer" "geo_question_layer" NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" "geo_question_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "geo_target_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geo_competitors" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "geo_competitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geo_probe_runs" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "snapshot_id" UUID,
    "target_question_id" UUID NOT NULL,
    "provider" "geo_provider" NOT NULL,
    "mode" "geo_probe_mode" NOT NULL,
    "raw_response" TEXT NOT NULL,
    "company_mentioned" BOOLEAN NOT NULL DEFAULT false,
    "mentioned_competitor_id" UUID,
    "cited_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cost_usd_cents" INTEGER,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "geo_probe_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geo_score_snapshots" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "user_id" UUID,
    "score" INTEGER NOT NULL,
    "breakdown" JSONB NOT NULL,
    "competitor_comparison" JSONB,
    "total_cost_usd_cents" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "geo_score_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "geo_target_questions_company_id_status_idx" ON "geo_target_questions"("company_id", "status");

-- CreateIndex
CREATE INDEX "geo_competitors_company_id_idx" ON "geo_competitors"("company_id");

-- CreateIndex
CREATE INDEX "geo_probe_runs_company_id_created_at_idx" ON "geo_probe_runs"("company_id", "created_at");

-- CreateIndex
CREATE INDEX "geo_probe_runs_snapshot_id_idx" ON "geo_probe_runs"("snapshot_id");

-- CreateIndex
CREATE INDEX "geo_probe_runs_target_question_id_idx" ON "geo_probe_runs"("target_question_id");

-- CreateIndex
CREATE INDEX "geo_score_snapshots_company_id_created_at_idx" ON "geo_score_snapshots"("company_id", "created_at");

-- AddForeignKey
ALTER TABLE "geo_target_questions" ADD CONSTRAINT "geo_target_questions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_competitors" ADD CONSTRAINT "geo_competitors_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_probe_runs" ADD CONSTRAINT "geo_probe_runs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_probe_runs" ADD CONSTRAINT "geo_probe_runs_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "geo_score_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_probe_runs" ADD CONSTRAINT "geo_probe_runs_target_question_id_fkey" FOREIGN KEY ("target_question_id") REFERENCES "geo_target_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_probe_runs" ADD CONSTRAINT "geo_probe_runs_mentioned_competitor_id_fkey" FOREIGN KEY ("mentioned_competitor_id") REFERENCES "geo_competitors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_score_snapshots" ADD CONSTRAINT "geo_score_snapshots_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
