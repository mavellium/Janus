import { NextRequest } from 'next/server'
import { findPublishedPage } from '@/modules/cms/queries/findPublishedPage'
import {
  cmsOptions,
  cmsRateLimit,
  cmsJson,
  cmsError,
} from '@/lib/cms-public'
import { pageMode, getPageData, getSection } from '@/lib/cms-sections'

export const OPTIONS = cmsOptions

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      companySlug: string
      pageSlug: string
      sectionKey: string
    }>
  },
) {
  const blocked = cmsRateLimit(req)
  if (blocked) return blocked

  const { companySlug, pageSlug, sectionKey } = await params
  const page = await findPublishedPage(companySlug, pageSlug)
  if (!page) return cmsError('Page not found or not published', 404)

  const key = decodeURIComponent(sectionKey)
  const section = getSection(getPageData(page), key)
  if (section === undefined) return cmsError('Section not found', 404)

  return cmsJson({
    slug: page.slug,
    name: page.name,
    mode: pageMode(page),
    section: key,
    updatedAt: page.updatedAt.toISOString(),
    data: section,
  })
}
