"use client"

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from "swr"
import { apiRequest } from "@/lib/api"

// Components
import ThingHeader from './components/ThingHeader'
import ThingContent from './components/ThingContent'
import ThingSpeedDial from './components/SpeedDial'

// Hooks and stores
import { useItemStore } from '@/app/thing/stores/itemStore'
import { useThingFilters } from '@/app/thing/hooks/useThingFilters'
import { useThingSearch } from '@/app/thing/hooks/useThingSearch'

// Types
import { Tag, LocationTreeResponse } from '@/app/thing/types'

export default function Thing() {
  const router = useRouter()
  const { 
    items, 
    categories, 
    loading, 
    error, 
    fetchItems, 
    fetchCategories, 
    meta 
  } = useItemStore()

  // 使用自定义hooks管理复杂逻辑
  const {
    filters,
    updateFilters,
    clearFilters,
    hasActiveFilters,
    currentPage,
    setCurrentPage
  } = useThingFilters()

  const {
    searchTerm,
    setSearchTerm,
    handleSearch,
    isSearching
  } = useThingSearch()

  // 基础数据加载
  const { data: tags } = useSWR<Tag[]>('/things/tags', apiRequest)
  const { data: locationData } = useSWR<LocationTreeResponse>('/locations/tree', apiRequest)

  // 初始化数据加载
  useEffect(() => {
    const initializeData = async () => {
      if (categories.length === 0) {
        await fetchCategories()
      }
      
      // 处理URL搜索参数
      const searchParams = new URLSearchParams(window.location.search)
      const searchFromURL = searchParams.get('search')
      
      if (searchFromURL) {
        setSearchTerm(searchFromURL)
        handleSearch(searchFromURL)
      } else {
        fetchItems()
      }
    }

    initializeData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 处理页面变化
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    fetchItems({ ...filters, page })
  }, [filters, fetchItems, setCurrentPage])

  // 处理筛选应用
  const handleApplyFilters = useCallback((newFilters: Record<string, unknown>) => {
    if (isSearching) return
    
    setCurrentPage(1)
    updateFilters(newFilters)
    fetchItems({ ...newFilters, page: 1 })
  }, [isSearching, setCurrentPage, updateFilters, fetchItems])

  // 处理重新加载
  const handleReload = useCallback(() => {
    fetchItems(filters)
  }, [fetchItems, filters])

  // 处理清除筛选
  const handleClearFilters = useCallback(() => {
    setSearchTerm('')
    clearFilters()
    fetchItems()
  }, [setSearchTerm, clearFilters, fetchItems])

  // 导航处理
  const handleItemEdit = useCallback((id: number) => {
    router.push(`/thing/${id}/edit`)
  }, [router])

  const handleItemView = useCallback((id: number) => {
    router.push(`/thing/${id}`)
  }, [router])

  return (
    <div className="container mx-auto py-2">
      <div className="flex flex-col space-y-4">
        <ThingHeader
          categories={categories}
          tags={tags || []}
          areas={locationData?.areas || []}
          rooms={locationData?.rooms || []}
          spots={locationData?.spots || []}
          filters={filters}
          hasActiveFilters={hasActiveFilters()}
          onApplyFilters={handleApplyFilters}
        />
        
        <ThingContent
          items={items}
          loading={loading}
          error={error}
          meta={meta}
          currentPage={currentPage}
          searchTerm={searchTerm}
          hasActiveFilters={hasActiveFilters()}
          onPageChange={handlePageChange}
          onItemEdit={handleItemEdit}
          onItemView={handleItemView}
          onReload={handleReload}
          onClearFilters={handleClearFilters}
        />
      </div>
      
      <ThingSpeedDial />
    </div>
  )
}