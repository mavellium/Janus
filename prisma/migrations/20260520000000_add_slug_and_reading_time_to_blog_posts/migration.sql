-- Add slug and reading_time to blog_posts
ALTER TABLE "blog_posts" ADD COLUMN "slug" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN "reading_time" INTEGER;

-- Populate slug from title for existing rows
UPDATE "blog_posts"
SET "slug" = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(title, '[àáâãäå]', 'a', 'gi'),
      '[èéêë]', 'e', 'gi'
    ),
    '[^a-z0-9\s-]', '', 'g'
  )
)
WHERE "slug" IS NULL;

-- Normalise spaces to hyphens
UPDATE "blog_posts"
SET "slug" = REGEXP_REPLACE(TRIM("slug"), '\s+', '-', 'g')
WHERE "slug" IS NOT NULL;

-- Deduplicate slugs within the same project
WITH ranked AS (
  SELECT id, project_id, slug,
    ROW_NUMBER() OVER (PARTITION BY project_id, slug ORDER BY created_at) AS rn
  FROM blog_posts
)
UPDATE blog_posts bp
SET slug = ranked.slug || '-' || ranked.rn
FROM ranked
WHERE bp.id = ranked.id AND ranked.rn > 1;

-- Apply unique constraint
CREATE UNIQUE INDEX "blog_posts_project_id_slug_key" ON "blog_posts"("project_id", "slug");
