-- Migração de reparo do histórico (mesma causa das 20260515024917 e 20260519999999).
--
-- Estas colunas de "users" foram criadas via `prisma db push`, sem migração correspondente.
-- A migração seguinte (20260524000000_add_user_company) lê u."permissions" para popular
-- user_companies e falhava no shadow database com "column u.permissions does not exist".
--
-- Idempotente: em bancos que já possuem as colunas nada acontece.

-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "requires_password_reset" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "created_by_id" UUID;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[];
