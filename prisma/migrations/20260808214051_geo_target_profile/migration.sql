/*
  Warnings:

  - You are about to drop the column `company_id` on the `geo_competitors` table. All the data in the column will be lost.
  - You are about to drop the column `company_id` on the `geo_probe_runs` table. All the data in the column will be lost.
  - You are about to drop the column `company_id` on the `geo_score_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `company_id` on the `geo_target_questions` table. All the data in the column will be lost.
  - You are about to drop the column `project_id` on the `geo_target_questions` table. All the data in the column will be lost.
  - Added the required column `profile_id` to the `geo_competitors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profile_id` to the `geo_probe_runs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profile_id` to the `geo_score_snapshots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profile_id` to the `geo_target_questions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "geo_competitors" DROP CONSTRAINT "geo_competitors_company_id_fkey";

-- DropForeignKey
ALTER TABLE "geo_probe_runs" DROP CONSTRAINT "geo_probe_runs_company_id_fkey";

-- DropForeignKey
ALTER TABLE "geo_score_snapshots" DROP CONSTRAINT "geo_score_snapshots_company_id_fkey";

-- DropForeignKey
ALTER TABLE "geo_target_questions" DROP CONSTRAINT "geo_target_questions_company_id_fkey";

-- DropIndex
DROP INDEX "geo_competitors_company_id_idx";

-- DropIndex
DROP INDEX "geo_probe_runs_company_id_created_at_idx";

-- DropIndex
DROP INDEX "geo_score_snapshots_company_id_created_at_idx";

-- DropIndex
DROP INDEX "geo_target_questions_company_id_status_idx";

-- AlterTable
ALTER TABLE "geo_competitors" DROP COLUMN "company_id",
ADD COLUMN     "profile_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "geo_probe_runs" DROP COLUMN "company_id",
ADD COLUMN     "profile_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "geo_score_snapshots" DROP COLUMN "company_id",
ADD COLUMN     "profile_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "geo_target_questions" DROP COLUMN "company_id",
DROP COLUMN "project_id",
ADD COLUMN     "profile_id" UUID NOT NULL;

-- CreateTable
CREATE TABLE "geo_target_profiles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "industry" TEXT,
    "location" TEXT,
    "website" TEXT,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "target_audience" TEXT,
    "differentiators" TEXT,
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "geo_target_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "geo_target_profiles_archived_at_idx" ON "geo_target_profiles"("archived_at");

-- CreateIndex
CREATE INDEX "geo_competitors_profile_id_idx" ON "geo_competitors"("profile_id");

-- CreateIndex
CREATE INDEX "geo_probe_runs_profile_id_created_at_idx" ON "geo_probe_runs"("profile_id", "created_at");

-- CreateIndex
CREATE INDEX "geo_score_snapshots_profile_id_created_at_idx" ON "geo_score_snapshots"("profile_id", "created_at");

-- CreateIndex
CREATE INDEX "geo_target_questions_profile_id_status_idx" ON "geo_target_questions"("profile_id", "status");

-- AddForeignKey
ALTER TABLE "geo_target_profiles" ADD CONSTRAINT "geo_target_profiles_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_target_questions" ADD CONSTRAINT "geo_target_questions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "geo_target_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_competitors" ADD CONSTRAINT "geo_competitors_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "geo_target_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_probe_runs" ADD CONSTRAINT "geo_probe_runs_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "geo_target_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_score_snapshots" ADD CONSTRAINT "geo_score_snapshots_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "geo_target_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
