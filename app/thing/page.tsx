"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { SlidersHorizontal, LayoutList, Grid } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import ItemCard from './components/ItemCard'
import ItemFilters from './components/ItemFilters'
import ItemGallery from './components/ItemGallery'
import { useItemStore } from '@/stores/itemStore'
import { Item } from '@/app/thing/types'
import ThingSpeedDial from './components/SpeedDial'

// 定义视图模式类型
type ViewMode = 'list' | 'gallery';

// 定义过滤器类型
interface FilterParams {
  page?: number;
  search?: string;
  category_id?: string | number;
  include_null_purchase_date?: boolean;
  include_null_expiry_date?: boolean;
  purchase_date_from?: Date | null;
  expiry_date_from?: Date | null;
  [key: string]: any;
}

export default function Thing() {
  const router = useRouter()
  const { items, categories, loading, error, fetchItems, fetchCategories, meta, filters: savedFilters, saveFilters } = useItemStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<string>('none')
  const [selectedPublicStatus, setSelectedPublicStatus] = useState<string>('none')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [initialLoaded, setInitialLoaded] = useState(false)
  
  // 计算总页数
  const totalPages = meta?.last_page || 1

  // 获取基础筛选参数
  const getBaseFilterParams = () => ({
    search: searchTerm || undefined,
    category_id: selectedCategory !== 'none' && selectedCategory !== '' ? selectedCategory : undefined,
    is_public: selectedPublicStatus === 'none' ? undefined : selectedPublicStatus === 'true'
  })

  // 加载数据
  const loadItems = (params = {}) => {
    const allParams = {
      ...getBaseFilterParams(),
      ...params
    };
    
    fetchItems(allParams);
    // 保存筛选条件，除了页码
    const filtersToSave = { ...allParams };
    if ('page' in filtersToSave) {
      delete filtersToSave.page;
    }
    saveFilters(filtersToSave);
  }

  useEffect(() => {
    // 从URL获取搜索参数
    const searchParams = new URLSearchParams(window.location.search)
    const search = searchParams.get('search')
    
    // 只在组件首次加载时执行
    if (!initialLoaded) {
      // 从 savedFilters 加载已保存的筛选条件
      if (Object.keys(savedFilters).length > 0) {
        // 恢复保存的筛选条件到本地状态
        if (savedFilters.search) {
          setSearchTerm(savedFilters.search);
        }
        
        if (savedFilters.category_id) {
          setSelectedCategory(String(savedFilters.category_id));
        }
        
        if (savedFilters.is_public !== undefined) {
          setSelectedPublicStatus(savedFilters.is_public === true ? 'true' : 'false');
        }
        
        // 使用已保存的筛选条件加载数据
        fetchItems(); // 会自动使用已保存的筛选条件
      } else if (search) {
        // 如果URL中有搜索参数但没有已保存的筛选条件
        setSearchTerm(search);
        const params = { search, page: 1 };
        loadItems(params);
      } else {
        // 没有筛选条件，加载所有物品
        loadItems();
      }
      setInitialLoaded(true);
    }
  }, [fetchItems, initialLoaded, savedFilters])
  
  // 单独加载分类
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // 处理页面变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    loadItems({ page })
  }

  // 处理分类变化
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value)
    setCurrentPage(1)
    loadItems({ 
      category_id: value === "none" ? undefined : value === "uncategorized" ? null : value,
      page: 1
    })
  }

  // 处理公开状态变化
  const handlePublicStatusChange = (value: string) => {
    setSelectedPublicStatus(value)
    setCurrentPage(1)
    loadItems({ 
      is_public: value === 'none' ? undefined : value === 'true',
      page: 1
    })
  }

  // 添加新物品
  const handleAddItem = () => {
    router.push('/thing/add')
  }

  // 应用筛选条件
  const handleApplyFilters = (filters: FilterParams) => {
    // 保存用于前端处理的空日期选项
    const includeNullPurchaseDate = filters.include_null_purchase_date;
    const includeNullExpiryDate = filters.include_null_expiry_date;
    
    // 移除undefined、null和空字符串值，同时移除特殊参数
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([key, value]) => 
        value !== undefined && value !== null && value !== '' && 
        key !== 'include_null_purchase_date' && key !== 'include_null_expiry_date' &&
        key !== 'exclude_null_purchase_date' && key !== 'exclude_null_expiry_date'
      )
    )
    
    setCurrentPage(1);
    setFiltersOpen(false);
    
    // 加载数据，不带特殊参数
    fetchItems({
      ...cleanFilters,
      page: 1
    }).then((result) => {
      // 处理前端过滤
      if (result?.data && (
          (filters.purchase_date_from && !includeNullPurchaseDate) || 
          (filters.expiry_date_from && !includeNullExpiryDate))
      ) {
        // 创建一个新的items数组，应用前端过滤
        const filteredItems = result.data.filter((item: Item) => {
          // 如果有购买日期筛选且不包含空日期
          if (filters.purchase_date_from && !includeNullPurchaseDate && item.purchase_date === null) {
            return false;
          }
          
          // 如果有过期日期筛选且不包含空日期
          if (filters.expiry_date_from && !includeNullExpiryDate && item.expiry_date === null) {
            return false;
          }
          
          return true;
        });
        
        // 更新状态中的items
        useItemStore.setState({ 
          items: filteredItems,
          meta: result.meta
        });
      }
      
      // 保存筛选条件（包括前端处理的特殊参数）
      const filtersToSave = {
        ...cleanFilters,
        include_null_purchase_date: includeNullPurchaseDate,
        include_null_expiry_date: includeNullExpiryDate
      };
      saveFilters(filtersToSave);
    });
  }

  // 在handleReset方法中也要清除保存的筛选条件
  const handleReset = () => {
    setSearchTerm('');
    setSelectedCategory('none');
    setSelectedPublicStatus('none');
    setCurrentPage(1);
    
    // 清除保存的筛选条件
    saveFilters({});
    
    // 重新加载数据
    loadItems({});
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
    if (totalPages <= 1) return null
    
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
    )
  }

  // 渲染物品列表
  const renderItems = () => (
    <>
      {viewMode === 'list' ? (
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
      ) : (
        <ItemGallery items={items} />
      )}

      {renderPagination()}
    </>
  )

  const renderFilters = () => (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2">
        <Select value={selectedPublicStatus} onValueChange={handlePublicStatusChange}>
          <SelectTrigger className="w-[110px] bg-primary/10 border-primary/20">
            <SelectValue placeholder="所有物品" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">所有物品</SelectItem>
            <SelectItem value="true">公开</SelectItem>
            <SelectItem value="false">私有</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[110px] bg-primary/10 border-primary/20">
            <SelectValue placeholder="所有分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">所有分类</SelectItem>
            <SelectItem value="uncategorized">未分类</SelectItem>
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
          <TabsTrigger value="list" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <LayoutList className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="gallery" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Grid className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="bg-primary/10 border-primary/20 hover:bg-primary/20">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent className="overflow-y-auto pb-10 max-w-[50%] sm:max-w-[300px]">
          <SheetHeader className="pb-1">
            <SheetTitle className="text-xl sr-only">筛选物品</SheetTitle>
            <SheetDescription className="text-sm sr-only">
              设置筛选条件以查找特定物品
            </SheetDescription>
          </SheetHeader>
          <div className="py-1">
            <ItemFilters 
              onApply={handleApplyFilters} 
              key={JSON.stringify(savedFilters)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )

  // 条件渲染内容
  const renderContent = () => {
    if (loading) return renderLoading()
    if (error) return renderError()
    return items.length === 0 ? renderEmpty() : renderItems()
  }

  // 返回组件
  return (
    <div className="flex flex-col gap-2 pb-24">
      <div className="flex justify-between items-center">
        {renderFilters()}
      </div>
      {renderContent()}
      
      {/* 添加Speed Dial组件 */}
      <ThingSpeedDial />
    </div>
  )
}