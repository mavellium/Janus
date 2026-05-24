-- CreateTable
CREATE TABLE "user_companies" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_companies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_companies_user_id_idx" ON "user_companies"("user_id");

-- CreateIndex
CREATE INDEX "user_companies_company_id_idx" ON "user_companies"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_companies_user_id_company_id_key" ON "user_companies"("user_id", "company_id");

-- AddForeignKey
ALTER TABLE "user_companies" ADD CONSTRAINT "user_companies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_companies" ADD CONSTRAINT "user_companies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Populate user_companies from existing companyId on users (preserves all existing data)
INSERT INTO "user_companies" ("id", "user_id", "company_id", "permissions", "created_at")
SELECT
    gen_random_uuid(),
    u."id",
    u."companyId",
    u."permissions",
    u."created_at"
FROM "users" u
WHERE u."deleted_at" IS NULL
  AND u."companyId" IS NOT NULL
ON CONFLICT ("user_id", "company_id") DO NOTHING;
