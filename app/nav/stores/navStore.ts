import { create } from 'zustand'
import { NavCategory, NavItem } from '@/app/nav/types'
import * as navApi from '@/app/nav/services/api'
import { toast } from 'sonner'

interface NavStore {
  categories: NavCategory[]
  items: NavItem[]
  loading: boolean
  error: string | null
  searchTerm: string
  filteredItems: NavItem[]
  
  // 获取数据
  fetchCategories: (filterName?: string) => Promise<NavCategory[]>
  fetchItems: (categoryId?: number) => Promise<NavItem[]>
  
  // 搜索
  setSearchTerm: (term: string) => void
  searchItems: (term: string) => void
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
  items: [],
  loading: false,
  error: null,
  searchTerm: '',
  filteredItems: [],
  
  // 设置搜索词
  setSearchTerm: (term: string) => {
    set({ searchTerm: term })
    get().searchItems(term)
  },
  
  // 搜索导航项
  searchItems: (term: string) => {
    const { items } = get()
    if (!term.trim()) {
      set({ filteredItems: items })
      return
    }
    
    const searchTermLower = term.toLowerCase()
    const filtered = items.filter(item => 
      item.name.toLowerCase().includes(searchTermLower) ||
      item.description?.toLowerCase().includes(searchTermLower) ||
      item.url.toLowerCase().includes(searchTermLower)
    )
    console.log('搜索结果:', filtered.length, '项')
    set({ filteredItems: filtered })
  },

  // 处理搜索事件
  handleSearch: (term: string) => {
    console.log('处理搜索:', term)
    get().setSearchTerm(term)
  },
  
  // 获取所有导航分类
  fetchCategories: async (filterName?: string) => {
    try {
      set({ loading: true, error: null })
      console.log("开始从API获取分类数据");
      const categories = await navApi.getCategories(filterName) || [];
      console.log("API返回分类数据:", categories);
      set({ categories, loading: false })
      return categories
    } catch (error) {
      console.error("获取分类数据错误:", error);
      const errorMessage = error instanceof Error ? error.message : '获取导航分类失败'
      set({ loading: false, error: errorMessage, categories: [] })
      throw error
    }
  },
  
  // 获取导航项
  fetchItems: async (categoryId?: number) => {
    try {
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
  
  // 创建分类
  createCategory: async (category: Partial<NavCategory>) => {
    try {
      console.log("开始创建分类:", category);
      const newCategory = await navApi.createCategory(category);
      console.log("API返回创建分类结果:", newCategory);
      
      // 更新categories状态
      set(state => ({
        categories: [...state.categories, newCategory]
      }));
      
      return newCategory;
    } catch (error) {
      console.error("创建分类失败:", error);
      const errorMessage = error instanceof Error ? error.message : '创建导航分类失败';
      set({ error: errorMessage });
      throw error;
    }
  },
  
  // 更新分类
  updateCategory: async (id: number, category: Partial<NavCategory>) => {
    try {
      const updatedCategory = await navApi.updateCategory(id, category)
      set(state => ({
        categories: state.categories.map(c => 
          c.id === id ? updatedCategory : c
        )
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
        categories: state.categories.filter(c => c.id !== id)
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
      set(state => {
        // 更新对应分类的导航项
        const updatedCategories = state.categories.map(category => {
          if (category.id === newItem.nav_category_id) {
            return {
              ...category,
              items: [...(category.items || []), newItem],
              items_count: (category.items_count || 0) + 1
            }
          }
          return category
        })
        
        return {
          items: [...state.items, newItem],
          categories: updatedCategories
        }
      })
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
        items: state.items.map(i => i.id === id ? updatedItem : i),
        categories: state.categories.map(category => {
          if (category.items) {
            return {
              ...category,
              items: category.items.map(i => 
                i.id === id ? updatedItem : i
              )
            }
          }
          return category
        })
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
        // 查找要删除的导航项
        const itemToDelete = state.items.find(i => i.id === id)
        
        // 更新导航分类
        const updatedCategories = state.categories.map(category => {
          if (itemToDelete && category.id === itemToDelete.nav_category_id) {
            return {
              ...category,
              items: (category.items || []).filter(i => i.id !== id),
              items_count: Math.max(0, (category.items_count || 0) - 1)
            }
          }
          return category
        })
        
        return {
          items: state.items.filter(i => i.id !== id),
          categories: updatedCategories
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
      // 更新本地点击数
      set(state => ({
        items: state.items.map(item => {
          if (item.id === itemId) {
            return { ...item, clicks: (item.clicks || 0) + 1 }
          }
          return item
        }),
        categories: state.categories.map(category => {
          if (category.items) {
            return {
              ...category,
              items: category.items.map(item => {
                if (item.id === itemId) {
                  return { ...item, clicks: (item.clicks || 0) + 1 }
                }
                return item
              })
            }
          }
          return category
        })
      }))
    } catch (error) {
      console.error('记录点击失败', error)
    }
  }
})) 