-- Migração de reparo do histórico (última da série; ver 20260515024917, 20260519999999,
-- 20260523999998 e 20260523999999).
--
-- Três divergências restantes entre o histórico e o banco real, todas originadas de
-- `prisma db push`:
--   1. o enum user_role ganhou a variante DEVELOPER sem migração;
--   2. as FKs de pages/projects/project_histories foram recriadas como CASCADE (é o que
--      schema.prisma declara), mas o histórico as criava como RESTRICT;
--   3. o índice de users.created_by_id não existia no histórico.
--
-- Idempotente: em bancos que já estão no estado final nada muda.

-- AlterEnum
ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'DEVELOPER';

-- DropForeignKey / AddForeignKey — realinha as regras de exclusão com schema.prisma
ALTER TABLE "pages" DROP CONSTRAINT IF EXISTS "pages_projectId_fkey";
ALTER TABLE "pages" ADD CONSTRAINT "pages_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "project_histories" DROP CONSTRAINT IF EXISTS "project_histories_projectId_fkey";
ALTER TABLE "project_histories" ADD CONSTRAINT "project_histories_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "project_histories" DROP CONSTRAINT IF EXISTS "project_histories_userId_fkey";
ALTER TABLE "project_histories" ADD CONSTRAINT "project_histories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_companyId_fkey";
ALTER TABLE "projects" ADD CONSTRAINT "projects_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "users_created_by_id_idx" ON "users"("created_by_id");
