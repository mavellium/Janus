export interface SystemRelease {
  id: number
  tagName: string
  name: string | null
  bodyHtml: string
  publishedAt: string | null
  htmlUrl: string
  prerelease: boolean
}
