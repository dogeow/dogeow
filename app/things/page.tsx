"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination } from "@/components/ui/pagination"
import { PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Plus, Search, Filter, SlidersHorizontal } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { format } from 'date-fns'
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import ItemCard from './components/ItemCard'
import ItemFilters from './components/ItemFilters'
import { useItemStore } from '@/stores/itemStore'

export default function Things() {
  const router = useRouter()
  const { items, categories, loading, error, fetchItems, fetchCategories } = useItemStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [viewMode, setViewMode] = useState('grid')

  useEffect(() => {
    // 从URL获取搜索参数
    const searchParams = new URLSearchParams(window.location.search)
    const search = searchParams.get('search')
    
    if (search) {
      setSearchTerm(search)
      fetchItems({ search, page: 1 })
    } else {
      fetchItems()
    }
    
    fetchCategories()
  }, [fetchItems, fetchCategories])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    fetchItems({ page, search: searchTerm })
  }

  const handleCategoryChange = (value) => {
    setSelectedCategory(value)
    const actualValue = value === "none" ? "" : value;
    fetchItems({ category_id: actualValue, page: 1, search: searchTerm })
    setCurrentPage(1)
  }

  const handleAddItem = () => {
    router.push('/things/add')
  }

  const handleApplyFilters = (filters) => {
    fetchItems({ ...filters, page: 1, search: searchTerm })
    setCurrentPage(1)
    setFiltersOpen(false)
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold mr-auto">物品管理</h1>
        <Button onClick={handleAddItem}>
          <Plus className="mr-2 h-4 w-4" /> 添加物品
        </Button>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="所有分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">所有分类</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto pb-10">
                <SheetHeader className="pb-1">
                  <SheetTitle className="text-xl">筛选物品</SheetTitle>
                  <SheetDescription className="text-sm">
                    设置筛选条件以查找特定物品
                  </SheetDescription>
                </SheetHeader>
                <div className="py-2">
                  <ItemFilters onApply={handleApplyFilters} />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <Tabs value={viewMode} onValueChange={setViewMode} className="w-[120px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="grid">网格</TabsTrigger>
              <TabsTrigger value="list">列表</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>加载中...</p>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-red-500">加载失败: {error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 bg-muted/50 rounded-lg">
          <p className="text-muted-foreground mb-4">暂无物品</p>
          <Button onClick={handleAddItem}>添加第一个物品</Button>
        </div>
      ) : (
        <>
          <div className={cn(
            "grid gap-4",
            viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'
          )}>
            {items.map((item) => (
              <ItemCard 
                key={item.id} 
                item={item} 
                viewMode={viewMode} 
                onEdit={() => router.push(`/things/${item.id}/edit`)}
                onView={() => router.push(`/things/${item.id}`)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-6 overflow-x-auto pb-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                      className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={page === currentPage}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                      className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  )
}