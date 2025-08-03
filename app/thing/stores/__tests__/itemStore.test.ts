import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act } from '@testing-library/react'
import { useItemStore } from '../itemStore'

// Mock dependencies
vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn(),
  API_URL: 'http://localhost:3000/api',
}))

vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
}))

describe('ItemStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store to initial state
    act(() => {
      useItemStore.getState().clearError()
    })
  })

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const state = useItemStore.getState()

      expect(state.items).toEqual([])
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
      expect(state.filters).toEqual({
        search: '',
        category_id: undefined,
        tag_id: undefined,
        area_id: undefined,
        room_id: undefined,
        spot_id: undefined,
        is_public: undefined,
        purchase_date: undefined,
        expiry_date: undefined,
        page: undefined,
        itemsOnly: undefined,
        include_null_purchase_date: undefined,
        include_null_expiry_date: undefined,
        exclude_null_purchase_date: undefined,
        exclude_null_expiry_date: undefined,
        tags: undefined,
      })
    })
  })

  describe('Item Management', () => {
    it('should fetch items correctly', async () => {
      const mockItems = [
        {
          id: 1,
          name: 'Test Item',
          description: 'Test Description',
          category_id: 1,
          location_id: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ]

      const mockMeta = {
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 1,
      }

      const { apiRequest } = await import('@/lib/api')
      vi.mocked(apiRequest).mockResolvedValue({
        data: mockItems,
        meta: mockMeta,
      })

      const result = await useItemStore.getState().fetchItems()

      expect(result).toEqual({
        data: mockItems,
        meta: mockMeta,
      })
      expect(useItemStore.getState().items).toEqual(mockItems)
    })

    it('should create item correctly', async () => {
      const mockItem = {
        id: 1,
        name: 'Test Item',
        description: 'Test Description',
        category_id: 1,
        location_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const { apiRequest } = await import('@/lib/api')
      vi.mocked(apiRequest).mockResolvedValue(mockItem)

      const result = await useItemStore.getState().createItem({
        name: 'Test Item',
        description: 'Test Description',
        quantity: 1,
        status: 'active',
        purchase_date: null,
        expiry_date: null,
        purchase_price: null,
        category_id: '1',
        area_id: '1',
        room_id: '1',
        spot_id: '1',
        is_public: true,
        thumbnail_url: null,
        image_paths: [],
      })

      expect(result).toEqual(mockItem)
    })

    it('should update item correctly', async () => {
      const mockItem = {
        id: 1,
        name: 'Updated Item',
        description: 'Updated Description',
        category_id: 1,
        location_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const { apiRequest } = await import('@/lib/api')
      vi.mocked(apiRequest).mockResolvedValue(mockItem)

      const result = await useItemStore.getState().updateItem(1, {
        name: 'Updated Item',
        description: 'Updated Description',
        quantity: 1,
        status: 'active',
        purchase_date: null,
        expiry_date: null,
        purchase_price: null,
        category_id: '1',
        area_id: '1',
        room_id: '1',
        spot_id: '1',
        is_public: true,
      })

      expect(result).toEqual(mockItem)
    })

    it('should delete item correctly', async () => {
      const { apiRequest } = await import('@/lib/api')
      vi.mocked(apiRequest).mockResolvedValue(undefined)

      await useItemStore.getState().deleteItem(1)

      expect(apiRequest).toHaveBeenCalledWith('/items/1', {
        method: 'DELETE',
      })
    })

    it('should get item by id correctly', async () => {
      const mockItem = {
        id: 1,
        name: 'Test Item',
        description: 'Test Description',
        category_id: 1,
        location_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const { apiRequest } = await import('@/lib/api')
      vi.mocked(apiRequest).mockResolvedValue(mockItem)

      const result = await useItemStore.getState().getItem(1)

      expect(result).toEqual(mockItem)
    })
  })

  describe('Category Management', () => {
    it('should fetch categories correctly', async () => {
      const mockCategories = [
        {
          id: 1,
          name: 'Test Category',
          parent_id: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ]

      const { apiRequest } = await import('@/lib/api')
      vi.mocked(apiRequest).mockResolvedValue(mockCategories)

      const result = await useItemStore.getState().fetchCategories()

      expect(result).toEqual(mockCategories)
      expect(useItemStore.getState().categories).toEqual(mockCategories)
    })

    it('should create category correctly', async () => {
      const mockCategory = {
        id: 1,
        name: 'Test Category',
        parent_id: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const { apiRequest } = await import('@/lib/api')
      vi.mocked(apiRequest).mockResolvedValue(mockCategory)

      const result = await useItemStore.getState().createCategory({
        name: 'Test Category',
        parent_id: null,
      })

      expect(result).toEqual(mockCategory)
    })
  })

  describe('Tag Management', () => {
    it('should fetch tags correctly', async () => {
      const mockTags = [
        {
          id: 1,
          name: 'Test Tag',
          color: '#ff0000',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ]

      const { apiRequest } = await import('@/lib/api')
      vi.mocked(apiRequest).mockResolvedValue(mockTags)

      const result = await useItemStore.getState().fetchTags()

      expect(result).toEqual(mockTags)
      expect(useItemStore.getState().tags).toEqual(mockTags)
    })
  })

  describe('Filter Management', () => {
    it('should save filters correctly', () => {
      const filters = {
        search: 'test',
        category_id: 1,
        tag_id: 2,
      }

      act(() => {
        useItemStore.getState().saveFilters(filters)
      })

      const state = useItemStore.getState()
      expect(state.filters.search).toBe('test')
      expect(state.filters.category_id).toBe(1)
      expect(state.filters.tag_id).toBe(2)
    })
  })

  describe('Error Handling', () => {
    it('should clear error correctly', () => {
      act(() => {
        useItemStore.getState().clearError()
      })

      expect(useItemStore.getState().error).toBeNull()
    })
  })
})
