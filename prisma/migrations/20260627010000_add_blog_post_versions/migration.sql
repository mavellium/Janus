-- CreateTable
CREATE TABLE "blog_post_versions" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "body" TEXT NOT NULL,
    "cover_image_url" TEXT,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "seo_keywords" TEXT,
    "reading_time" INTEGER,
    "created_by_id" UUID,
    "created_by_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_post_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blog_post_versions_post_id_idx" ON "blog_post_versions"("post_id");

-- CreateIndex
CREATE INDEX "blog_post_versions_created_at_idx" ON "blog_post_versions"("created_at");

-- AddForeignKey
ALTER TABLE "blog_post_versions" ADD CONSTRAINT "blog_post_versions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
