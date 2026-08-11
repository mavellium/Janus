-- Migração de reparo do histórico.
--
-- As tabelas guest_entries e guest_posts foram criadas originalmente via `prisma db push`,
-- sem migração correspondente. Por isso a migração seguinte
-- (20260515024918_add_media_type_to_guest_posts) falhava com "relation guest_posts does not
-- exist" ao ser reproduzida do zero no shadow database, mesmo com o banco real íntegro.
--
-- Esta migração recria as duas tabelas de forma idempotente (IF NOT EXISTS), exatamente
-- como já existem em produção/dev, e é ordenada imediatamente antes daquela ALTER TABLE.
-- Em bancos que já possuem as tabelas nada acontece; no shadow database elas passam a
-- existir antes do ALTER.

-- CreateTable
CREATE TABLE IF NOT EXISTS "guest_entries" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "companyId" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "guest_posts" (
    "id" UUID NOT NULL,
    "title" TEXT,
    "message" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "guestId" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "guest_entries_companyId_idx" ON "guest_entries"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "guest_entries_email_companyId_key" ON "guest_entries"("email", "companyId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "guest_posts_guestId_idx" ON "guest_posts"("guestId");

-- AddForeignKey
DO $$
BEGIN
    ALTER TABLE "guest_entries" ADD CONSTRAINT "guest_entries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$
BEGIN
    ALTER TABLE "guest_posts" ADD CONSTRAINT "guest_posts_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guest_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
