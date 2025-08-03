import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act } from '@testing-library/react'
import { useItemStore } from '../itemStore'

// Mock dependencies
vi.mock('@/lib/api', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
}))

describe('ItemStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const state = useItemStore.getState()

      expect(state.items).toEqual([])
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
      expect(state.selectedItem).toBeNull()
      expect(state.filters).toEqual({
        category: null,
        location: null,
        search: '',
      })
    })
  })

  describe('Item Management', () => {
    it('should add item correctly', () => {
      const mockItem = {
        id: 1,
        name: 'Test Item',
        description: 'Test Description',
        category_id: 1,
        location_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      act(() => {
        useItemStore.getState().addItem(mockItem)
      })

      const state = useItemStore.getState()
      expect(state.items).toContain(mockItem)
    })

    it('should update item correctly', () => {
      const mockItem = {
        id: 1,
        name: 'Original Name',
        description: 'Original Description',
        category_id: 1,
        location_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const updatedItem = {
        ...mockItem,
        name: 'Updated Name',
        description: 'Updated Description',
      }

      // Add item first
      act(() => {
        useItemStore.getState().addItem(mockItem)
      })

      // Update item
      act(() => {
        useItemStore.getState().updateItem(updatedItem)
      })

      const state = useItemStore.getState()
      expect(state.items).toContain(updatedItem)
      expect(state.items).not.toContain(mockItem)
    })

    it('should remove item correctly', () => {
      const mockItem = {
        id: 1,
        name: 'Test Item',
        description: 'Test Description',
        category_id: 1,
        location_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      // Add item first
      act(() => {
        useItemStore.getState().addItem(mockItem)
      })

      // Remove item
      act(() => {
        useItemStore.getState().removeItem(1)
      })

      const state = useItemStore.getState()
      expect(state.items).not.toContain(mockItem)
    })

    it('should set items correctly', () => {
      const mockItems = [
        {
          id: 1,
          name: 'Item 1',
          description: 'Description 1',
          category_id: 1,
          location_id: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          name: 'Item 2',
          description: 'Description 2',
          category_id: 2,
          location_id: 2,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ]

      act(() => {
        useItemStore.getState().setItems(mockItems)
      })

      const state = useItemStore.getState()
      expect(state.items).toEqual(mockItems)
    })
  })

  describe('Selection Management', () => {
    it('should select item correctly', () => {
      const mockItem = {
        id: 1,
        name: 'Test Item',
        description: 'Test Description',
        category_id: 1,
        location_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      act(() => {
        useItemStore.getState().selectItem(mockItem)
      })

      const state = useItemStore.getState()
      expect(state.selectedItem).toEqual(mockItem)
    })

    it('should clear selection correctly', () => {
      const mockItem = {
        id: 1,
        name: 'Test Item',
        description: 'Test Description',
        category_id: 1,
        location_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      // Select item first
      act(() => {
        useItemStore.getState().selectItem(mockItem)
      })

      // Clear selection
      act(() => {
        useItemStore.getState().clearSelection()
      })

      const state = useItemStore.getState()
      expect(state.selectedItem).toBeNull()
    })
  })

  describe('Filter Management', () => {
    it('should set category filter correctly', () => {
      act(() => {
        useItemStore.getState().setCategoryFilter(1)
      })

      const state = useItemStore.getState()
      expect(state.filters.category).toBe(1)
    })

    it('should set location filter correctly', () => {
      act(() => {
        useItemStore.getState().setLocationFilter(2)
      })

      const state = useItemStore.getState()
      expect(state.filters.location).toBe(2)
    })

    it('should set search filter correctly', () => {
      act(() => {
        useItemStore.getState().setSearchFilter('test search')
      })

      const state = useItemStore.getState()
      expect(state.filters.search).toBe('test search')
    })

    it('should clear filters correctly', () => {
      // Set filters first
      act(() => {
        useItemStore.getState().setCategoryFilter(1)
        useItemStore.getState().setLocationFilter(2)
        useItemStore.getState().setSearchFilter('test')
      })

      // Clear filters
      act(() => {
        useItemStore.getState().clearFilters()
      })

      const state = useItemStore.getState()
      expect(state.filters.category).toBeNull()
      expect(state.filters.location).toBeNull()
      expect(state.filters.search).toBe('')
    })
  })

  describe('Loading States', () => {
    it('should set loading state correctly', () => {
      act(() => {
        useItemStore.getState().setLoading(true)
      })

      expect(useItemStore.getState().loading).toBe(true)
    })

    it('should set error state correctly', () => {
      const mockError = new Error('Test error')

      act(() => {
        useItemStore.getState().setError(mockError)
      })

      expect(useItemStore.getState().error).toEqual(mockError)
    })

    it('should clear error correctly', () => {
      const mockError = new Error('Test error')

      // Set error first
      act(() => {
        useItemStore.getState().setError(mockError)
      })

      // Clear error
      act(() => {
        useItemStore.getState().clearError()
      })

      expect(useItemStore.getState().error).toBeNull()
    })
  })

  describe('Filtered Items', () => {
    it('should filter items by category', () => {
      const mockItems = [
        {
          id: 1,
          name: 'Item 1',
          description: 'Description 1',
          category_id: 1,
          location_id: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          name: 'Item 2',
          description: 'Description 2',
          category_id: 2,
          location_id: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ]

      // Set items
      act(() => {
        useItemStore.getState().setItems(mockItems)
      })

      // Set category filter
      act(() => {
        useItemStore.getState().setCategoryFilter(1)
      })

      const state = useItemStore.getState()
      const filteredItems = state.getFilteredItems()
      expect(filteredItems).toHaveLength(1)
      expect(filteredItems[0].category_id).toBe(1)
    })

    it('should filter items by search term', () => {
      const mockItems = [
        {
          id: 1,
          name: 'Apple',
          description: 'Red apple',
          category_id: 1,
          location_id: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          name: 'Banana',
          description: 'Yellow banana',
          category_id: 1,
          location_id: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ]

      // Set items
      act(() => {
        useItemStore.getState().setItems(mockItems)
      })

      // Set search filter
      act(() => {
        useItemStore.getState().setSearchFilter('apple')
      })

      const state = useItemStore.getState()
      const filteredItems = state.getFilteredItems()
      expect(filteredItems).toHaveLength(1)
      expect(filteredItems[0].name).toBe('Apple')
    })
  })

  describe('Utility Methods', () => {
    it('should get item by id', () => {
      const mockItems = [
        {
          id: 1,
          name: 'Item 1',
          description: 'Description 1',
          category_id: 1,
          location_id: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          name: 'Item 2',
          description: 'Description 2',
          category_id: 2,
          location_id: 2,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ]

      act(() => {
        useItemStore.getState().setItems(mockItems)
      })

      const state = useItemStore.getState()
      const item = state.getItemById(1)
      expect(item).toEqual(mockItems[0])
    })

    it('should return null for non-existent item', () => {
      const state = useItemStore.getState()
      const item = state.getItemById(999)
      expect(item).toBeNull()
    })

    it('should get items count', () => {
      const mockItems = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ]

      act(() => {
        useItemStore.getState().setItems(mockItems)
      })

      const state = useItemStore.getState()
      expect(state.getItemsCount()).toBe(3)
    })
  })
})
