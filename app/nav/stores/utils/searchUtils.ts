import type { NavItem } from '@/app/nav/types'

/**
 * 搜索导航项
 */
export function searchItems(items: NavItem[], term: string): NavItem[] {
  if (!term.trim()) {
    return items
  }

  const searchTermLower = term.toLowerCase()
  return items.filter(
    item =>
      item.name.toLowerCase().includes(searchTermLower) ||
      item.description?.toLowerCase().includes(searchTermLower) ||
      item.url.toLowerCase().includes(searchTermLower)
  )
}
