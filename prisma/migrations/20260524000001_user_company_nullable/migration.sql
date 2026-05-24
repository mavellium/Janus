ALTER TABLE "users" ALTER COLUMN "companyId" DROP NOT NULL;

ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_companyId_fkey";

ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
