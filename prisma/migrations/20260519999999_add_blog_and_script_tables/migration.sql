-- Migração de reparo do histórico (mesma causa da 20260515024917_add_guest_tables).
--
-- As tabelas de blog e site_scripts foram criadas via `prisma db push`, sem migração
-- correspondente. As migrações seguintes que fazem ALTER TABLE nelas falhavam ao serem
-- reproduzidas do zero no shadow database ("relation blog_posts does not exist"), mesmo
-- com o banco real íntegro.
--
-- Esta migração recria tabelas, enums e índices de forma idempotente, exatamente como já
-- existem em produção/dev, ordenada antes do primeiro ALTER que depende delas. Em bancos
-- que já as possuem nada acontece.
--
-- As colunas adicionadas por migrações POSTERIORES (slug/reading_time em blog_posts,
-- is_advanced etc.) NÃO entram aqui — elas continuam sendo aplicadas por suas próprias
-- migrações, na ordem original.

-- CreateEnum
DO $$
BEGIN
    CREATE TYPE "blog_post_status" AS ENUM ('DRAFT', 'PUBLISHED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$
BEGIN
    CREATE TYPE "script_position" AS ENUM ('HEAD', 'BODY_END');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "blog_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "slug" TEXT NOT NULL,
    "project_id" UUID NOT NULL,
    "parent_id" UUID,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "seo_keywords" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "blog_tags" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "slug" TEXT NOT NULL,
    "project_id" UUID NOT NULL,
    "parent_id" UUID,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "seo_keywords" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "blog_posts" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "published_at" TIMESTAMP(3),
    "body" TEXT NOT NULL,
    "cover_image_url" TEXT,
    "author_name" TEXT NOT NULL,
    "author_id" UUID,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "seo_keywords" TEXT,
    "status" "blog_post_status" NOT NULL DEFAULT 'PUBLISHED',
    "project_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "blog_post_categories" (
    "post_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,

    CONSTRAINT "blog_post_categories_pkey" PRIMARY KEY ("post_id","category_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "blog_post_tags" (
    "post_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "blog_post_tags_pkey" PRIMARY KEY ("post_id","tag_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "site_scripts" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "position" "script_position" NOT NULL DEFAULT 'HEAD',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "project_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_scripts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "blog_categories_project_id_idx" ON "blog_categories"("project_id");
CREATE INDEX IF NOT EXISTS "blog_categories_parent_id_idx" ON "blog_categories"("parent_id");
CREATE UNIQUE INDEX IF NOT EXISTS "blog_categories_project_id_slug_key" ON "blog_categories"("project_id", "slug");
CREATE INDEX IF NOT EXISTS "blog_tags_project_id_idx" ON "blog_tags"("project_id");
CREATE INDEX IF NOT EXISTS "blog_tags_parent_id_idx" ON "blog_tags"("parent_id");
CREATE UNIQUE INDEX IF NOT EXISTS "blog_tags_project_id_slug_key" ON "blog_tags"("project_id", "slug");
CREATE INDEX IF NOT EXISTS "blog_posts_project_id_idx" ON "blog_posts"("project_id");
CREATE INDEX IF NOT EXISTS "blog_posts_author_id_idx" ON "blog_posts"("author_id");
CREATE INDEX IF NOT EXISTS "blog_posts_status_idx" ON "blog_posts"("status");
CREATE INDEX IF NOT EXISTS "site_scripts_project_id_idx" ON "site_scripts"("project_id");
CREATE INDEX IF NOT EXISTS "site_scripts_is_active_idx" ON "site_scripts"("is_active");

-- AddForeignKey
DO $$
BEGIN
    ALTER TABLE "blog_categories" ADD CONSTRAINT "blog_categories_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "blog_categories" ADD CONSTRAINT "blog_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "blog_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "blog_tags" ADD CONSTRAINT "blog_tags_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "blog_tags" ADD CONSTRAINT "blog_tags_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "blog_tags"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "blog_post_categories" ADD CONSTRAINT "blog_post_categories_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "blog_post_categories" ADD CONSTRAINT "blog_post_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "blog_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "blog_post_tags" ADD CONSTRAINT "blog_post_tags_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "blog_post_tags" ADD CONSTRAINT "blog_post_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "blog_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "site_scripts" ADD CONSTRAINT "site_scripts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
