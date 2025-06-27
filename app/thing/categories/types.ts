export interface Category {
  id: number
  name: string
  items_count?: number
  created_at?: string
  updated_at?: string
}

export interface CategoryFormData {
  name: string
}

export interface CategoryApiResponse {
  data: Category[]
  meta?: {
    total: number
    current_page: number
    last_page: number
    per_page: number
  }
}

export interface UncategorizedCountResponse {
  data: unknown[]
  meta?: {
    total: number
  }
} 