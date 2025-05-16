"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { SlidersHorizontal, LayoutList, Grid, X, FilterX, ChevronDownIcon } from "lucide-react"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import ItemCard from './components/ItemCard'
import ItemFilters from './components/ItemFilters'
import ItemGallery from './components/ItemGallery'
import { useItemStore } from '@/app/thing/stores/itemStore'
import { Item } from '@/app/thing/types'
import ThingSpeedDial from './components/SpeedDial'
import { Badge } from "@/components/ui/badge"
import useSWR from "swr"
import { get } from "@/lib/api"
import { isLightColor } from '@/lib/helpers'

// 定义视图模式类型
type ViewMode = 'list' | 'gallery';

// 定义过滤器类型
interface FilterParams {
  page?: number;
  search?: string;
  category_id?: string | number;
  tags?: string[] | number[] | string;
  include_null_purchase_date?: boolean;
  include_null_expiry_date?: boolean;
  purchase_date_from?: Date | null;
  expiry_date_from?: Date | null;
  [key: string]: any;
}

// 标签类型定义
type Tag = {
  id: number
  name: string
  color?: string
  items_count?: number
  created_at?: string
  updated_at?: string
}

export default function Thing() {
  const router = useRouter()
  const { items, categories, loading, error, fetchItems, fetchCategories, meta, filters: savedFilters, saveFilters } = useItemStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<string>('none')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [tagMenuOpen, setTagMenuOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [initialLoaded, setInitialLoaded] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [initialDataLoaded, setInitialDataLoaded] = useState(false)
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false)
  
  // 标签加载
  const { data: tags } = useSWR<Tag[]>(
    '/thing-tags', 
    get,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshWhenOffline: false,
      refreshWhenHidden: false,
      refreshInterval: 0,
      dedupingInterval: 3600000, // 1小时不重复请求
      onSuccess: () => {
        setInitialDataLoaded(true)
      }
    }
  )
  
  // 计算总页数
  const totalPages = meta?.last_page || 1

  // 获取基础筛选参数
  const getBaseFilterParams = useCallback(() => ({
    search: searchTerm || undefined,
    category_id: selectedCategory !== 'none' && selectedCategory !== '' ? selectedCategory : undefined,
    tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined
  }), [searchTerm, selectedCategory, selectedTags]);

  // 处理点击外部关闭标签菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagMenuOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('.tag-dropdown-container')) {
          setTagMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [tagMenuOpen]);

  // 处理点击外部关闭分类菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryMenuOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('.category-dropdown-container')) {
          setCategoryMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [categoryMenuOpen]);

  // 在组件初始化时加载基础数据
  useEffect(() => {
    if (!initialDataLoaded) {
      const loadAllData = async () => {
        try {
          if (categories.length === 0) {
            await fetchCategories();
          }
          
          setInitialDataLoaded(true);
          
          if (selectedTags.length > 0) {
            setSelectedTags(selectedTags.map(tag => tag.toString()));
          }
        } catch (error) {
          console.error('初始数据加载失败:', error);
        }
      };
      
      loadAllData();
    }
  }, [categories.length, fetchCategories, initialDataLoaded, selectedTags]);

  // 初始加载数据
  useEffect(() => {
    if (!initialLoaded) {
      const searchParams = new URLSearchParams(window.location.search)
      const search = searchParams.get('search')
      
      if (Object.keys(savedFilters).length > 0) {
        if (savedFilters.search) {
          setSearchTerm(savedFilters.search);
        }
        
        if (savedFilters.category_id) {
          setSelectedCategory(String(savedFilters.category_id));
        }
        
        if (savedFilters.tags && Array.isArray(savedFilters.tags)) {
          setSelectedTags(savedFilters.tags);
        }
        
        fetchItems();
      } else if (search) {
        setSearchTerm(search);
        loadItems({ search, page: 1 });
      } else {
        loadItems();
      }
      setInitialLoaded(true);
    }
  }, [initialLoaded, savedFilters, fetchItems])

  // 加载数据函数
  const loadItems = useCallback((params = {}) => {
    if (isSearching) return Promise.resolve();
    
    setIsSearching(true);
    
    const allParams = {
      ...getBaseFilterParams(),
      ...params
    };
    
    const filtersToSave = { ...allParams };
    if ('page' in filtersToSave) {
      delete filtersToSave.page;
    }
    saveFilters(filtersToSave);
    
    const itemsOnly = params.hasOwnProperty('search') || params.hasOwnProperty('itemsOnly');
    
    return fetchItems(allParams, itemsOnly)
      .finally(() => {
        setIsSearching(false);
      });
  }, [fetchItems, getBaseFilterParams, isSearching, saveFilters]);

  // 处理页面变化
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    loadItems({ page })
  }, [loadItems]);

  // 处理分类变化
  const handleCategoryChange = useCallback((value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
    loadItems({ 
      category_id: value === "none" ? undefined : value === "uncategorized" ? null : value,
      page: 1
    });
  }, [loadItems]);

  // 重置筛选条件
  const handleReset = useCallback(() => {
    setSearchTerm('');
    setSelectedCategory('none');
    setSelectedTags([]);
    setCurrentPage(1);
    
    saveFilters({});
    loadItems({});
  }, [loadItems, saveFilters]);

  // 检查是否有激活的筛选条件
  const hasActiveFilters = useCallback(() => {
    const activeFilters = Object.entries(savedFilters).filter(([key, value]) => {
      if (value === undefined || value === null || value === '' || value === 'all' || 
          (Array.isArray(value) && value.length === 0) ||
          (key === 'include_null_purchase_date' && value === true) ||
          (key === 'include_null_expiry_date' && value === true)) {
        return false;
      }
      
      if (key === 'category_id' && (value === 'none' || value === '')) {
        return false;
      }
      
      return true;
    });
    
    return activeFilters.length > 0;
  }, [savedFilters]);

  // 获取标签样式
  const getTagStyle = useCallback((color: string = "#3b82f6", isSelected: boolean = false) => {
    return {
      backgroundColor: isSelected ? color : 'transparent',
      color: isSelected ? (isLightColor(color) ? "#000" : "#fff") : color,
      borderColor: color
    }
  }, []);

  // 添加新物品
  const handleAddItem = useCallback(() => {
    router.push('/thing/add')
  }, [router]);

  // 应用筛选条件
  const handleApplyFilters = useCallback((filters: FilterParams) => {
    const includeNullPurchaseDate = filters.include_null_purchase_date;
    const includeNullExpiryDate = filters.include_null_expiry_date;
    
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([key, value]) => 
        value !== undefined && value !== null && value !== '' && 
        key !== 'include_null_purchase_date' && key !== 'include_null_expiry_date' &&
        key !== 'exclude_null_purchase_date' && key !== 'exclude_null_expiry_date'
      )
    )
    
    setCurrentPage(1);
    
    fetchItems({
      ...cleanFilters,
      page: 1
    }).then((result) => {
      if (result?.data && (
          (filters.purchase_date_from && !includeNullPurchaseDate) || 
          (filters.expiry_date_from && !includeNullExpiryDate))
      ) {
        const filteredItems = result.data.filter((item: Item) => {
          if (filters.purchase_date_from && !includeNullPurchaseDate && item.purchase_date === null) {
            return false;
          }
          
          if (filters.expiry_date_from && !includeNullExpiryDate && item.expiry_date === null) {
            return false;
          }
          
          return true;
        });
        
        useItemStore.setState({ 
          items: filteredItems,
          meta: {
            ...result.meta,
            total: filteredItems.length
          }
        });
      }
      
      const filtersToSave = {
        ...cleanFilters,
        include_null_purchase_date: includeNullPurchaseDate,
        include_null_expiry_date: includeNullExpiryDate
      };
      saveFilters(filtersToSave);
    });
  }, [fetchItems, saveFilters]);

  // 处理标签点击
  const handleTagClick = useCallback((tagId: string) => {
    const updatedTags = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
      
    setSelectedTags(updatedTags);
    loadItems({
      tags: updatedTags.length > 0 ? updatedTags.join(',') : undefined,
      page: 1
    });
    
    setTagMenuOpen(false);
  }, [selectedTags, loadItems]);

  // 处理分类点击
  const handleCategoryClick = useCallback((value: string) => {
    handleCategoryChange(value);
    setCategoryMenuOpen(false);
  }, [handleCategoryChange]);

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

  // 渲染筛选侧边栏
  const renderFilterSidebar = () => (
    <SheetContent className="overflow-y-auto pb-10 max-w-[150px] sm:max-w-[150px]">
      <div className="flex items-center px-4 pt-5 pb-2 mr-8">
        <SheetTitle className="text-base font-medium">筛选</SheetTitle>
        {hasActiveFilters() && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleReset}
            className="h-7 ml-2 px-2 flex items-center gap-1 text-xs"
          >
            <FilterX className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <div className="py-1">
        <ItemFilters 
          onApply={handleApplyFilters} 
          key={JSON.stringify(savedFilters)}
        />
      </div>
    </SheetContent>
  )

  // 条件渲染内容
  const renderContent = () => {
    if (loading) return renderLoading()
    if (error) return renderError()
    return items.length === 0 ? renderEmpty() : renderItems()
  }

  const renderFilters = () => (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2">
        <div className="relative category-dropdown-container">
          <Button 
            variant="outline" 
            onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
            className="w-[110px] bg-primary/10 border-primary/20 flex items-center justify-between"
          >
            {selectedCategory === 'none' ? "所有分类" : 
             selectedCategory === 'uncategorized' ? "未分类" : 
             categories.find(c => c.id.toString() === selectedCategory)?.name || "所有分类"}
            <ChevronDownIcon className="ml-2 h-4 w-4" />
          </Button>
          
          {categoryMenuOpen && (
            <div className="absolute top-full left-0 z-50 mt-1 w-56 rounded-md border border-gray-200 bg-white shadow-lg">
              <div className="p-2">
                <div 
                  className={`flex items-center text-sm p-2 hover:bg-gray-100 rounded-md cursor-pointer ${selectedCategory === 'none' ? 'bg-accent/50 text-accent-foreground' : 'text-gray-600'}`}
                  onClick={() => handleCategoryClick('none')}
                >
                  所有分类
                </div>
                <div 
                  className={`flex items-center text-sm p-2 hover:bg-gray-100 rounded-md cursor-pointer ${selectedCategory === 'uncategorized' ? 'bg-accent/50 text-accent-foreground' : 'text-gray-600'}`}
                  onClick={() => handleCategoryClick('uncategorized')}
                >
                  未分类
                </div>
                {categories.map((category) => (
                  <div 
                    key={category.id}
                    className={`flex items-center text-sm p-2 hover:bg-gray-100 rounded-md cursor-pointer ${selectedCategory === category.id.toString() ? 'bg-accent/50 text-accent-foreground' : 'text-gray-600'}`}
                    onClick={() => handleCategoryClick(category.id.toString())}
                  >
                    {category.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative tag-dropdown-container">
          <Button 
            variant="outline" 
            onClick={() => setTagMenuOpen(!tagMenuOpen)}
            className="w-[110px] bg-primary/10 border-primary/20 flex items-center justify-between"
          >
            {selectedTags.length > 0 ? `${selectedTags.length}个标签` : "选择标签"}
            <ChevronDownIcon className="ml-2 h-4 w-4" />
          </Button>
          
          {tagMenuOpen && (
            <div className="absolute top-full left-0 z-50 mt-1 w-56 rounded-md border border-gray-200 bg-white shadow-lg">
              <div className="p-2">
                {selectedTags.length > 0 && (
                  <div 
                    className="flex items-center text-sm text-gray-600 p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                    onClick={() => {
                      setSelectedTags([]);
                      loadItems({ tags: undefined, page: 1 });
                      setTagMenuOpen(false);
                    }}
                  >
                    <X className="h-3 w-3 mr-2" />
                    清除所有标签
                  </div>
                )}
                
                <div className="py-2">
                  <div className="flex flex-wrap gap-1 max-h-[300px] overflow-y-auto p-1">
                    {!tags ? (
                      <div className="flex justify-center py-2 w-full">
                        <span className="text-sm text-muted-foreground">加载中...</span>
                      </div>
                    ) : tags.length === 0 ? (
                      <div className="flex justify-center py-2 w-full">
                        <span className="text-sm text-muted-foreground">暂无标签</span>
                      </div>
                    ) : (
                      tags.map((tag) => (
                        <div 
                          key={tag.id} 
                          className={`relative cursor-pointer rounded-md p-0.5 ${selectedTags.includes(tag.id.toString()) ? 'bg-accent/50' : ''}`}
                          onClick={() => handleTagClick(tag.id.toString())}
                        >
                          <Badge
                            style={getTagStyle(tag.color, selectedTags.includes(tag.id.toString()))}
                            variant={selectedTags.includes(tag.id.toString()) ? "default" : "outline"}
                            className="text-xs h-6 px-2"
                          >
                            {tag.name}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
          <TabsList className="grid grid-cols-2 bg-primary/10 dark:bg-primary/20">
            <TabsTrigger 
              value="list" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground"
            >
              <LayoutList className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger 
              value="gallery" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground"
            >
              <Grid className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Sheet open={filtersOpen} onOpenChange={(open) => {
          if (open !== filtersOpen) {
            setFiltersOpen(open);
          }
        }}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className={`bg-primary/10 border-primary/20 hover:bg-primary/20 dark:bg-primary/20 dark:border-primary/30 dark:hover:bg-primary/30`}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          {renderFilterSidebar()}
        </Sheet>
      </div>
    </div>
  )

  // 返回组件
  return (
    <div className="flex flex-col gap-2 pb-20">
      <div className="flex justify-between items-center">
        {renderFilters()}
      </div>
      
      {renderContent()}
      
      <ThingSpeedDial />
    </div>
  )
}