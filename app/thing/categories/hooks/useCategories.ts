import { useState, useCallback } from 'react'
import { toast } from "sonner"
import { useItemStore } from '@/app/thing/stores/itemStore'
import { put, del } from '@/lib/api'
import { API_ENDPOINTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants'

export const useCategories = () => {
  const { categories, fetchCategories } = useItemStore()
  const [loading, setLoading] = useState(false)

  const updateCategory = useCallback(async (id: number, name: string) => {
    if (!name.trim()) {
      toast.error(ERROR_MESSAGES.CATEGORY_NAME_EMPTY)
      return false
    }

    setLoading(true)
    try {
      await put(`${API_ENDPOINTS.CATEGORIES}/${id}`, { name })
      toast.success(SUCCESS_MESSAGES.CATEGORY_UPDATED)
      await fetchCategories()
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : ERROR_MESSAGES.UPDATE_FAILED)
      return false
    } finally {
      setLoading(false)
    }
  }, [fetchCategories])

  const deleteCategory = useCallback(async (id: number) => {
    setLoading(true)
    try {
      await del(`${API_ENDPOINTS.CATEGORIES}/${id}`)
      toast.success(SUCCESS_MESSAGES.CATEGORY_DELETED)
      await fetchCategories()
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : ERROR_MESSAGES.DELETE_FAILED)
      return false
    } finally {
      setLoading(false)
    }
  }, [fetchCategories])

  const refreshCategories = useCallback(async () => {
    await fetchCategories()
  }, [fetchCategories])

  return {
    categories,
    loading,
    updateCategory,
    deleteCategory,
    refreshCategories
  }
} 