-- Migração de reparo do histórico (mesma causa das 20260515024917, 20260519999999 e
-- 20260523999999).
--
-- Estas colunas de companies/projects/pages foram criadas via `prisma db push`, sem
-- migração correspondente. Sem elas o histórico replicado do zero (shadow database)
-- diverge do banco real, e o Prisma passa a detectar drift/mudanças fantasma.
--
-- Idempotente: em bancos que já possuem as colunas nada acontece.

-- AlterTable
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "created_by_id" UUID;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "guest_mode_enabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "preview_url" TEXT;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "cms_sync_script_url" TEXT;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "cms_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "blog_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "deleted_by" TEXT;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "deletion_reason" TEXT;

-- AlterTable
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "preview_url" TEXT;
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "schema_data" JSONB DEFAULT '{}';
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "content_data" JSONB DEFAULT '{}';
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "ui_schema" JSONB DEFAULT '{}';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "companies_created_by_id_idx" ON "companies"("created_by_id");
CREATE INDEX IF NOT EXISTS "projects_is_active_idx" ON "projects"("is_active");
