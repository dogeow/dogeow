import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ThingNavigation from '../ThingNavigation'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/thing'),
}))

// Mock translation hook
vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback,
  }),
}))

describe('ThingNavigation', () => {
  describe('渲染', () => {
    it('应该渲染所有导航项', () => {
      render(<ThingNavigation />)

      expect(screen.getByText('所有物品')).toBeInTheDocument()
      expect(screen.getByText('分类')).toBeInTheDocument()
      expect(screen.getByText('位置')).toBeInTheDocument()
      expect(screen.getByText('标签')).toBeInTheDocument()
    })

    it('应该高亮当前激活的导航项', () => {
      const { usePathname } = require('next/navigation')
      usePathname.mockReturnValue('/thing')

      render(<ThingNavigation />)

      const allThingsLink = screen.getByText('所有物品').closest('a')
      expect(allThingsLink?.parentElement).toHaveClass('font-medium')
    })

    it('应该为分类页面高亮分类导航项', () => {
      const { usePathname } = require('next/navigation')
      usePathname.mockReturnValue('/thing/categories')

      render(<ThingNavigation />)

      const categoriesLink = screen.getByText('分类').closest('a')
      expect(categoriesLink?.parentElement).toHaveClass('font-medium')
    })

    it('应该为位置页面高亮位置导航项', () => {
      const { usePathname } = require('next/navigation')
      usePathname.mockReturnValue('/thing/locations')

      render(<ThingNavigation />)

      const locationsLink = screen.getByText('位置').closest('a')
      expect(locationsLink?.parentElement).toHaveClass('font-medium')
    })

    it('应该为标签页面高亮标签导航项', () => {
      const { usePathname } = require('next/navigation')
      usePathname.mockReturnValue('/thing/tags')

      render(<ThingNavigation />)

      const tagsLink = screen.getByText('标签').closest('a')
      expect(tagsLink?.parentElement).toHaveClass('font-medium')
    })
  })

  describe('链接', () => {
    it('应该包含正确的链接地址', () => {
      render(<ThingNavigation />)

      expect(screen.getByText('所有物品').closest('a')).toHaveAttribute('href', '/thing')
      expect(screen.getByText('分类').closest('a')).toHaveAttribute('href', '/thing/categories')
      expect(screen.getByText('位置').closest('a')).toHaveAttribute('href', '/thing/locations')
      expect(screen.getByText('标签').closest('a')).toHaveAttribute('href', '/thing/tags')
    })
  })
})
