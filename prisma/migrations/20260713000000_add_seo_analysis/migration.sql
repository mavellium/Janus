-- CreateEnum
CREATE TYPE "seo_analysis_type" AS ENUM ('SEO');

-- CreateTable
CREATE TABLE "seo_analyses" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "project_id" UUID,
    "target_url" TEXT NOT NULL,
    "type" "seo_analysis_type" NOT NULL DEFAULT 'SEO',
    "score" INTEGER NOT NULL,
    "checks" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seo_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "seo_analyses_company_id_idx" ON "seo_analyses"("company_id");

-- CreateIndex
CREATE INDEX "seo_analyses_created_at_idx" ON "seo_analyses"("created_at");

-- AddForeignKey
ALTER TABLE "seo_analyses" ADD CONSTRAINT "seo_analyses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seo_analyses" ADD CONSTRAINT "seo_analyses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
