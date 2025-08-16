import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { FilterParams } from '@/app/thing/types'

interface FilterPersistenceState {
  savedFilters: FilterParams
  saveFilters: (filters: FilterParams) => void
  clearFilters: () => void
  getFilters: () => FilterParams
}

export const useFilterPersistenceStore = create<FilterPersistenceState>()(
  persist(
    (set, get) => ({
      savedFilters: {},

      saveFilters: (filters: FilterParams) => {
        set({ savedFilters: filters })
      },

      clearFilters: () => {
        set({ savedFilters: {} })
      },

      getFilters: () => {
        return get().savedFilters
      },
    }),
    {
      name: 'thing-filters-persistence',
      // 只保存特定的筛选字段
      partialize: state => ({
        savedFilters: {
          category_id: state.savedFilters.category_id,
          tags: state.savedFilters.tags,
          area_id: state.savedFilters.area_id,
          room_id: state.savedFilters.room_id,
          spot_id: state.savedFilters.spot_id,
          is_public: state.savedFilters.is_public,
          purchase_date_from: state.savedFilters.purchase_date_from,
          purchase_date_to: state.savedFilters.purchase_date_to,
          expiry_date_from: state.savedFilters.expiry_date_from,
          expiry_date_to: state.savedFilters.expiry_date_to,
          price_from: state.savedFilters.price_from,
          price_to: state.savedFilters.price_to,
          include_null_purchase_date: state.savedFilters.include_null_purchase_date,
          include_null_expiry_date: state.savedFilters.include_null_expiry_date,
        },
      }),
    }
  )
)
