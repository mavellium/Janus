-- DropForeignKey
ALTER TABLE "seo_analyses" DROP CONSTRAINT "seo_analyses_user_id_fkey";

-- AddForeignKey
ALTER TABLE "seo_analyses" ADD CONSTRAINT "seo_analyses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
