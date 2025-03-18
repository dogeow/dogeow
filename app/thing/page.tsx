"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Plus, SlidersHorizontal } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import ItemCard from './components/ItemCard'
import ItemFilters from './components/ItemFilters'
import ThingNavigation from './components/ThingNavigation'
import ItemGallery from './components/ItemGallery'
import { useItemStore } from '@/stores/itemStore'

// 定义视图模式类型
type ViewMode = 'list' | 'gallery';

// 定义过滤器类型
interface FilterParams {
  page?: number;
  search?: string;
  category_id?: string | number;
  [key: string]: any;
}

export default function Thing() {
  const router = useRouter()
  const { items, categories, loading, error, fetchItems, fetchCategories, meta } = useItemStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  
  // 计算总页数
  const totalPages = meta?.last_page || 1

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

  // 处理页面变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchItems({ page, search: searchTerm, category_id: selectedCategory !== 'none' ? selectedCategory : '' })
  }

  // 处理分类变化
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value)
    const actualValue = value === "none" ? "" : value;
    fetchItems({ category_id: actualValue, page: 1, search: searchTerm })
    setCurrentPage(1)
  }

  // 添加新物品
  const handleAddItem = () => {
    router.push('/thing/add')
  }

  // 应用筛选条件
  const handleApplyFilters = (filters: FilterParams) => {
    fetchItems({ 
      ...filters, 
      page: 1, 
      search: searchTerm,
      category_id: selectedCategory !== 'none' ? selectedCategory : ''
    })
    setCurrentPage(1)
    setFiltersOpen(false)
  }

  // 渲染加载状态
  const renderLoading = () => (
    <div className="flex justify-center items-center h-64">
      <p>加载中...</p>
    </div>
  )

  // 渲染错误状态
  const renderError = () => (
    <div className="flex justify-center items-center h-64">
      <p className="text-red-500">加载失败: {error}</p>
    </div>
  )

  // 渲染空状态
  const renderEmpty = () => (
    <div className="flex flex-col justify-center items-center h-64 bg-muted/50 rounded-lg">
      <p className="text-muted-foreground mb-4">暂无物品</p>
      <Button onClick={handleAddItem}>添加第一个物品</Button>
    </div>
  )

  // 渲染分页
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex justify-center mt-6 overflow-x-auto pb-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                size="icon"
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={page === currentPage}
                  onClick={() => handlePageChange(page)}
                  size="icon"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                size="icon"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  }

  // 渲染物品列表
  const renderItems = () => (
    <>
      {viewMode === 'gallery' ? (
        <ItemGallery items={items} />
      ) : (
        <div className="grid gap-4 grid-cols-1">
          {items.map((item) => (
            <ItemCard 
              key={item.id} 
              item={item} 
              onEdit={() => router.push(`/thing/${item.id}/edit`)}
              onView={() => router.push(`/thing/${item.id}`)}
            />
          ))}
        </div>
      )}

      {renderPagination()}
    </>
  )

  return (
    <>
      <ThingNavigation />
      
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-[140px] bg-primary/10 border-primary/20">
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
            </div>

            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
              <TabsList className="grid grid-cols-2 bg-primary/10">
                <TabsTrigger value="list" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">列表</TabsTrigger>
                <TabsTrigger value="gallery" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">图片廊</TabsTrigger>
              </TabsList>
            </Tabs>

            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="bg-primary/10 border-primary/20 hover:bg-primary/20">
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
        </div>

        {loading ? renderLoading() : 
         error ? renderError() : 
         items.length === 0 ? renderEmpty() : 
         renderItems()}
      </div>
    </>
  )
}