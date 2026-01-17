export interface SearchResult {
  id: number | string
  title: string
  content: string
  url: string
  category: string
  isPublic?: boolean
  requireAuth?: boolean // 是否需要认证才能访问
  thumbnail_url?: string | null
}
