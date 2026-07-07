import { NextRequest } from 'next/server'
import { findPublishedPage } from '@/modules/cms/queries/findPublishedPage'
import {
  cmsOptions,
  cmsRateLimit,
  cmsJson,
  cmsError,
} from '@/lib/cms-public'
import { pageMode } from '@/lib/cms-sections'

export const OPTIONS = cmsOptions

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ companySlug: string; pageSlug: string }> },
) {
  const blocked = cmsRateLimit(req)
  if (blocked) return blocked

  const { companySlug, pageSlug } = await params
  const page = await findPublishedPage(companySlug, pageSlug)
  if (!page) return cmsError('Page not found or not published', 404)

  return cmsJson({
    slug: page.slug,
    name: page.name,
    mode: pageMode(page),
    updatedAt: page.updatedAt.toISOString(),
    ...(page.isAdvanced
      ? { schema: page.schemaData ?? {} }
      : { content: page.contentData ?? {} }),
  })
}
