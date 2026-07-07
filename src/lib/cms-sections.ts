export type PageMode = 'advanced' | 'standard'

export interface PageDataLike {
  isAdvanced: boolean
  schemaData: unknown
  contentData: unknown
}

export interface SectionInfo {
  key: string
  label: string
}

const METADATA_KEYS = new Set(['name', 'slug', 'schema', 'uiSchema'])

function asObject(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

export function pageMode(page: { isAdvanced: boolean }): PageMode {
  return page.isAdvanced ? 'advanced' : 'standard'
}

export function getPageData(page: PageDataLike): unknown {
  return page.isAdvanced ? page.schemaData : page.contentData
}

export function resolveSectionsRoot(data: unknown): Record<string, unknown> {
  const obj = asObject(data)
  if (!obj) return {}
  const content = asObject(obj.content)
  return content ?? obj
}

export function listSectionKeys(data: unknown): string[] {
  const root = resolveSectionsRoot(data)
  const isWrapped = asObject(asObject(data)?.content) !== null
  return Object.keys(root).filter((key) => isWrapped || !METADATA_KEYS.has(key))
}

export function getSection(data: unknown, sectionKey: string): unknown {
  const root = resolveSectionsRoot(data)
  if (Object.prototype.hasOwnProperty.call(root, sectionKey)) {
    return root[sectionKey]
  }
  let current: unknown = asObject(data) ?? root
  for (const part of sectionKey.split('.')) {
    const obj = asObject(current)
    if (!obj || !Object.prototype.hasOwnProperty.call(obj, part)) return undefined
    current = obj[part]
  }
  return current
}

function legacyLabels(page: PageDataLike): Record<string, string> {
  if (page.isAdvanced || !Array.isArray(page.schemaData)) return {}
  const map: Record<string, string> = {}
  for (const entry of page.schemaData) {
    const section = asObject(entry)
    if (!section) continue
    const key = (section.id ?? section.name ?? section.section) as
      | string
      | undefined
    if (!key) continue
    map[key] = (section.name ?? section.label ?? key) as string
  }
  return map
}

export function listSections(page: PageDataLike): SectionInfo[] {
  const keys = listSectionKeys(getPageData(page))
  const labels = legacyLabels(page)
  return keys.map((key) => ({ key, label: labels[key] ?? key }))
}
