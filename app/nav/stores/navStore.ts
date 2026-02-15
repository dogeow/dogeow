import { create } from 'zustand'
import { NavCategory, NavItem } from '@/app/nav/types'
import * as navApi from '@/app/nav/services/api'
import { searchItems } from './utils/searchUtils'
import { getSampleCategories, getSampleItems, combineCategoriesWithItems } from './utils/sampleData'
import {
  updateCategoryInList,
  removeCategoryFromList,
  addCategoryToList,
} from './utils/categoryHelpers'
import {
  updateItemInList,
  removeItemFromList,
  addItemToList,
  updateItemInCategories,
  removeItemFromCategories,
  addItemToCategory,
  incrementItemClicks,
} from './utils/itemHelpers'

interface NavStore {
  categories: NavCategory[]
  allCategories: NavCategory[]
  items: NavItem[]
  isSampleData: boolean
  loading: boolean
  error: string | null
  searchTerm: string

  // 获取数据
  fetchCategories: (filterName?: string) => Promise<NavCategory[]>
  fetchAllCategories: () => Promise<NavCategory[]>
  fetchItems: (categoryId?: number) => Promise<NavItem[]>
  applySampleData: () => void

  // 搜索
  setSearchTerm: (term: string) => void
  handleSearch: (term: string) => void

  // 分类管理
  createCategory: (category: Partial<NavCategory>) => Promise<NavCategory>
  updateCategory: (id: number, category: Partial<NavCategory>) => Promise<NavCategory>
  deleteCategory: (id: number) => Promise<void>

  // 导航项管理
  createItem: (item: Partial<NavItem>) => Promise<NavItem>
  updateItem: (id: number, item: Partial<NavItem>) => Promise<NavItem>
  deleteItem: (id: number) => Promise<void>
  recordClick: (itemId: number) => Promise<void>
}

export const useNavStore = create<NavStore>((set, get) => ({
  categories: [],
  allCategories: [],
  items: [],
  isSampleData: false,
  loading: false,
  error: null,
  searchTerm: '',

  // 设置搜索词
  setSearchTerm: (term: string) => {
    set({ searchTerm: term })
  },

  // 处理搜索事件
  handleSearch: (term: string) => {
    set({ searchTerm: term })
  },

  // 获取所有导航分类（用于展示，只包含有导航项的分类）
  fetchCategories: async (filterName?: string) => {
    try {
      if (get().isSampleData) {
        const { categories } = get()
        set({ loading: false, error: null })
        return categories
      }
      set({ loading: true, error: null })
      const categories = (await navApi.getCategories(filterName)) || []
      set({ categories, loading: false })
      return categories
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取导航分类失败'
      set({ loading: false, error: errorMessage, categories: [] })
      throw error
    }
  },

  // 获取所有分类（用于管理，包括空分类）
  fetchAllCategories: async () => {
    try {
      if (get().isSampleData) {
        const { allCategories } = get()
        set({ loading: false, error: null })
        return allCategories
      }
      set({ loading: true, error: null })
      const allCategories = (await navApi.getAllCategories()) || []
      set({ allCategories, loading: false })
      return allCategories
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取所有导航分类失败'
      set({ loading: false, error: errorMessage, allCategories: [] })
      throw error
    }
  },

  // 获取导航项
  fetchItems: async (categoryId?: number) => {
    try {
      if (get().isSampleData) {
        const { items: allItems } = get()
        const filtered = categoryId
          ? allItems.filter(item => item.nav_category_id === categoryId)
          : allItems
        set({ items: filtered, loading: false, error: null })
        return filtered
      }
      set({ loading: true, error: null })
      const items = await navApi.getItems(categoryId)
      set({ items, loading: false })
      return items
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取导航项失败'
      set({ loading: false, error: errorMessage })
      throw error
    }
  },

  // 填充示例导航与分类（仅在无数据时）
  applySampleData: () => {
    const { categories, items, isSampleData } = get()
    if (isSampleData || categories.length > 0 || items.length > 0) return

    const sampleCategories = getSampleCategories()
    const sampleItems = getSampleItems()
    const categoriesWithItems = combineCategoriesWithItems(sampleCategories, sampleItems)

    set({
      categories: categoriesWithItems,
      allCategories: categoriesWithItems,
      items: sampleItems,
      isSampleData: true,
    })
  },

  // 创建分类
  createCategory: async (category: Partial<NavCategory>) => {
    try {
      const newCategory = await navApi.createCategory(category)
      set(state => ({
        categories: addCategoryToList(state.categories, newCategory),
        allCategories: addCategoryToList(state.allCategories, newCategory),
      }))
      return newCategory
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建导航分类失败'
      set({ error: errorMessage })
      throw error
    }
  },

  // 更新分类
  updateCategory: async (id: number, category: Partial<NavCategory>) => {
    try {
      const updatedCategory = await navApi.updateCategory(id, category)
      set(state => ({
        categories: updateCategoryInList(state.categories, id, updatedCategory),
        allCategories: updateCategoryInList(state.allCategories, id, updatedCategory),
      }))
      return updatedCategory
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新导航分类失败'
      set({ error: errorMessage })
      throw error
    }
  },

  // 删除分类
  deleteCategory: async (id: number) => {
    try {
      await navApi.deleteCategory(id)
      set(state => ({
        categories: removeCategoryFromList(state.categories, id),
        allCategories: removeCategoryFromList(state.allCategories, id),
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除导航分类失败'
      set({ error: errorMessage })
      throw error
    }
  },

  // 创建导航项
  createItem: async (item: Partial<NavItem>) => {
    try {
      const newItem = await navApi.createItem(item)
      set(state => ({
        items: addItemToList(state.items, newItem),
        categories: addItemToCategory(state.categories, newItem),
      }))
      return newItem
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建导航项失败'
      set({ error: errorMessage })
      throw error
    }
  },

  // 更新导航项
  updateItem: async (id: number, item: Partial<NavItem>) => {
    try {
      const updatedItem = await navApi.updateItem(id, item)
      set(state => ({
        items: updateItemInList(state.items, id, updatedItem),
        categories: updateItemInCategories(state.categories, id, updatedItem),
      }))
      return updatedItem
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新导航项失败'
      set({ error: errorMessage })
      throw error
    }
  },

  // 删除导航项
  deleteItem: async (id: number) => {
    try {
      await navApi.deleteItem(id)
      set(state => {
        const itemToDelete = state.items.find(i => i.id === id)
        return {
          items: removeItemFromList(state.items, id),
          categories: itemToDelete
            ? removeItemFromCategories(state.categories, id, itemToDelete.nav_category_id)
            : state.categories,
        }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除导航项失败'
      set({ error: errorMessage })
      throw error
    }
  },

  // 记录点击
  recordClick: async (itemId: number) => {
    try {
      await navApi.recordClick(itemId)
      set(state => ({
        items: state.items.map(item => {
          if (item.id === itemId) {
            return { ...item, clicks: (item.clicks || 0) + 1 }
          }
          return item
        }),
        categories: incrementItemClicks(state.categories, itemId),
      }))
    } catch (error) {
      console.error('记录点击失败', error)
    }
  },
}))
