"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { SlidersHorizontal, LayoutList, Grid, X, ChevronDownIcon } from "lucide-react"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import ItemCard from './components/ItemCard'
import ItemFilters from './components/ItemFilters'
import ItemGallery from './components/ItemGallery'
import { useItemStore } from '@/app/thing/stores/itemStore'
import ThingSpeedDial from './components/SpeedDial'
import { Badge } from "@/components/ui/badge"
import useSWR from "swr"
import { apiRequest } from "@/lib/api"
import { isLightColor } from '@/lib/helpers'
import { ViewMode, Tag, FilterParams, LocationTreeResponse, Item } from '@/app/thing/types'
import { useUncategorizedCount } from '@/app/thing/hooks/useUncategorizedCount'

export default function Thing() {
  const router = useRouter()
  const { items, categories: categoriesFromStore, loading, error, fetchItems, fetchCategories, meta, filters: savedFilters, saveFilters } = useItemStore() // Renamed categories to categoriesFromStore
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
  
  // 使用共享的未分类数量hook
  const { count: uncategorizedCount } = useUncategorizedCount()
  
  // 标签加载
  const { data: tags } = useSWR<Tag[]>('/things/tags', apiRequest);
  // 统一获取位置数据
  const { data: locationData } = useSWR<LocationTreeResponse>('/locations/tree', apiRequest);
  
  // 从统一接口中提取各类位置数据
  const areas = locationData?.areas || [];
  const rooms = locationData?.rooms || [];
  const spots = locationData?.spots || [];
  
  // 计算总页数
  const totalPages = meta?.last_page || 1

  // 获取基础筛选参数
  const getBaseFilterParams = useCallback((): Partial<FilterParams> => ({
    search: searchTerm || undefined,
    category_id: selectedCategory !== 'none' && selectedCategory !== '' ? selectedCategory : undefined,
    tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined
  }), [searchTerm, selectedCategory, selectedTags]);

  // 加载数据函数
  const loadItems = useCallback((params: Partial<FilterParams> = {}) => {
    // 添加调试日志
    console.log('加载物品数据，参数:', params);
    
    if (isSearching) {
      console.log('已有搜索请求正在进行，跳过');
      return Promise.resolve();
    }
    
    // 如果是侧边栏状态变化引起的，且没有传入特定参数，则不重新加载
    if (params.isFilterToggle && Object.keys(params).length === 1) {
      console.log('仅过滤器切换，不重新加载');
      return Promise.resolve();
    }
    
    setIsSearching(true);
    
    const allParams = {
      ...getBaseFilterParams(),
      ...params
    };
    
    // 打印最终参数
    console.log('最终请求参数:', allParams);
    
    // 移除非API参数
    if ('isFilterToggle' in allParams) {
      delete allParams.isFilterToggle;
    }
    
    return fetchItems(allParams)
      .then(result => {
        console.log('请求成功，结果:', result);
        // 请求成功后再保存筛选条件
        const filtersToSave = { ...allParams };
        if ('page' in filtersToSave) {
          delete filtersToSave.page;
        }
        saveFilters(filtersToSave);
        return result;
      })
      .catch(error => {
        console.error('请求失败:', error);
        throw error;
      })
      .finally(() => {
        setIsSearching(false);
      });
  }, [fetchItems, getBaseFilterParams, isSearching, saveFilters]);

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
          // Use categoriesFromStore here
          if (categoriesFromStore.length === 0) { 
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
  }, [categoriesFromStore.length, fetchCategories, initialDataLoaded, selectedTags]); // Updated dependency

  // 初始加载数据
  useEffect(() => {
    if (!initialLoaded) {
      const searchParams = new URLSearchParams(window.location.search)
      const searchFromURL = searchParams.get('search')
      
      if (Object.keys(savedFilters).length > 0) {
        // 应用已保存的筛选条件
        if (savedFilters.search && searchTerm !== savedFilters.search) {
          // store里的searchTerm会在setSearchTerm时自动更新
          setSearchTerm(savedFilters.search);
        }
        
        if (savedFilters.category_id) {
          setSelectedCategory(String(savedFilters.category_id));
        }
        
        if (savedFilters.tags && Array.isArray(savedFilters.tags)) {
          setSelectedTags(savedFilters.tags.map(tag => tag.toString()));
        }
        
        // 使用store加载数据
        fetchItems();
      } else if (searchFromURL) {
        // URL中有搜索参数，直接传递给后端API
        console.log('从URL获取搜索参数:', searchFromURL);
        
        if (searchTerm !== searchFromURL) {
          setSearchTerm(searchFromURL);
        }
        
        // 直接调用API加载搜索结果
        loadItems({ 
          search: searchFromURL, 
          page: 1 
        });
        
        // 记录到URL以便分享
        const updatedUrl = new URL(window.location.href);
        updatedUrl.searchParams.set('search', searchFromURL);
        window.history.replaceState({}, '', updatedUrl);
      } else {
        // 没有筛选条件，加载所有数据
        loadItems();
      }
      setInitialLoaded(true);
    }
  }, [initialLoaded, savedFilters, fetchItems, loadItems, searchTerm])

  // 监听URL中search参数的变化
  useEffect(() => {
    if (initialLoaded) {
      const handleUrlChange = () => {
        const searchParams = new URLSearchParams(window.location.search);
        const search = searchParams.get('search');
        
        if (search && search !== searchTerm) {
          setSearchTerm(search);
          loadItems({ search, page: 1 });
        }
      };

      // 初始检查
      handleUrlChange();

      // 监听popstate事件（历史记录导航，比如前进后退按钮）
      window.addEventListener('popstate', handleUrlChange);
      
      // 监听自定义搜索事件
      const handleCustomSearch = (event: CustomEvent) => {
        const { searchTerm: newSearchTerm } = event.detail;
        // 添加调试日志
        console.log('接收搜索事件:', newSearchTerm, 
                    'isString:', typeof newSearchTerm === 'string',
                    '长度:', newSearchTerm?.length,
                    'charCode[0]:', newSearchTerm ? newSearchTerm.charCodeAt(0) : 'N/A',
                    'currentSearch:', searchTerm);
        
        // 标准化两个字符串再进行比较
        const normalizedCurrent = String(searchTerm || '').trim();
        const normalizedNew = String(newSearchTerm || '').trim();
        
        // 确保即使是单个字符"我"也能触发搜索
        const hasChanged = normalizedCurrent !== normalizedNew;
        console.log('比较结果:', hasChanged, '标准化后当前:', normalizedCurrent, '新:', normalizedNew);
        
        if (hasChanged) {
          console.log('搜索词已变化，执行搜索');
          setSearchTerm(newSearchTerm);
          loadItems({ search: newSearchTerm || undefined, page: 1 });
        } else {
          console.log('搜索词未变化，跳过搜索');
        }
      };
      
      // 添加自定义事件监听器
      document.addEventListener('thing-search', handleCustomSearch as EventListener);
      
      return () => {
        window.removeEventListener('popstate', handleUrlChange);
        document.removeEventListener('thing-search', handleCustomSearch as EventListener);
      };
    }
  }, [initialLoaded, loadItems, searchTerm]);

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
      category_id: value === "none" ? undefined : value === "uncategorized" ? undefined : value,
      page: 1
    });
  }, [loadItems]);

  // 处理侧边栏状态变化
  const handleFiltersOpenChange = useCallback((open: boolean) => {
    setFiltersOpen(open);
  }, []);

  // 筛选条件应用
  const handleApplyFilters = useCallback((filters: Record<string, unknown>) => {
    if (isSearching) return;
    
    setCurrentPage(1);
    saveFilters(filters);
    loadItems({ ...filters, page: 1 });
  }, [loadItems, saveFilters, isSearching]);

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

  // 已移除fetchUncategorizedCount，现在使用useUncategorizedCount hook

  // 渲染加载状态
  const renderLoading = () => (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <ItemCard 
          key={`loading-${index}`}
          item={{} as Item} 
          onEdit={() => {}} 
          onView={() => {}} 
          isLoading={true}
        />
      ))}
    </div>
  )

  // 渲染错误状态
  const renderError = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-2">加载失败</h3>
      <p className="text-muted-foreground mb-4">无法加载物品数据，请稍后重试</p>
      <Button onClick={() => loadItems()} variant="outline">
        重新加载
      </Button>
    </div>
  )

  // 渲染空状态
  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 9h.01M15 9h.01M9 15h.01M15 15h.01" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold mb-2">暂无物品</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        {searchTerm || selectedCategory !== 'none' || selectedTags.length > 0 
          ? '没有找到符合条件的物品，试试调整筛选条件' 
          : '还没有添加任何物品，点击右下角的加号开始添加吧'
        }
      </p>
      {(searchTerm || selectedCategory !== 'none' || selectedTags.length > 0) && (
        <Button 
          onClick={() => {
            setSearchTerm('')
            setSelectedCategory('none')
            setSelectedTags([])
            loadItems({ search: '', category_id: undefined, tags: undefined })
          }} 
          variant="outline"
          className="mb-4"
        >
          清除筛选条件
        </Button>
      )}
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
    <Sheet 
      open={filtersOpen} 
      onOpenChange={handleFiltersOpenChange}
    >
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="mr-1"
          data-state={filtersOpen ? "open" : "closed"}
          onClick={(e) => {
            e.preventDefault();
            handleFiltersOpenChange(!filtersOpen);
          }}
        >
          <SlidersHorizontal className={`h-4 w-4 mr-2 ${hasActiveFilters() ? 'text-primary' : ''}`} />
        </Button>
      </SheetTrigger>
      <SheetContent 
        className="sm:max-w-md p-4 max-w-[200px] overflow-y-auto h-full bg-white text-gray-900 border-l border-gray-200 shadow-xl dark:bg-[#23272f] dark:text-white dark:border-[#2d323b]"
        side="right" 
        onEscapeKeyDown={() => handleFiltersOpenChange(false)}
        onPointerDownOutside={() => handleFiltersOpenChange(false)}
      >
        <SheetTitle className="flex justify-between mb-3">
          筛选
          <X 
            className="h-5 w-5 cursor-pointer hover:opacity-70" 
            onClick={() => handleFiltersOpenChange(false)} 
          />
        </SheetTitle>
        <ItemFilters 
          onApply={handleApplyFilters} 
          key={`filters-${filtersOpen ? 'open' : 'closed'}`}
          categories={categoriesFromStore || []}
          tags={tags || []}
          areas={areas || []}
          rooms={rooms || []}
          spots={spots || []}
        />
      </SheetContent>
    </Sheet>
  )

  // 条件渲染内容
  const renderContent = () => {
    if (loading) return renderLoading()
    if (error) return renderError()
    return items.length === 0 ? renderEmpty() : renderItems()
  }

  // 渲染分类下拉菜单
  const renderCategoryDropdown = () => (
    <div className="relative category-dropdown-container">
      <Button 
        variant="outline" 
        onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
        className="w-[110px] bg-white/90 rounded-lg shadow border-primary/20 flex items-center justify-between"
      >
        {selectedCategory === 'none' ? "所有分类" : 
         selectedCategory === 'uncategorized' ? "未分类" : 
         categoriesFromStore.find(c => c.id.toString() === selectedCategory)?.name || "所有分类"}
        <ChevronDownIcon className="ml-2 h-4 w-4" />
      </Button>
      
      {categoryMenuOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 w-56 rounded-md border border-gray-200 bg-white shadow-lg dark:bg-gray-800">
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
              <span className="flex-1">未分类</span>
              <span className="ml-2 text-xs text-muted-foreground">{uncategorizedCount}</span>
            </div>
            {/* Use categoriesFromStore */}
            {categoriesFromStore.map((category) => ( 
              <div 
                key={category.id}
                className={`flex items-center text-sm p-2 hover:bg-gray-100 rounded-md cursor-pointer ${selectedCategory === category.id.toString() ? 'bg-accent/50 text-accent-foreground' : 'text-gray-600'}`}
                onClick={() => handleCategoryClick(category.id.toString())}
              >
                <span className="flex-1">{category.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">{category.items_count ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  // 渲染标签下拉菜单
  const renderTagDropdown = () => (
    <div className="relative tag-dropdown-container">
      <Button 
        variant="outline" 
        onClick={() => setTagMenuOpen(!tagMenuOpen)}
        className="w-[110px] bg-white/90 rounded-lg shadow border-primary/20 flex items-center justify-between"
      >
        {selectedTags.length > 0 ? `${selectedTags.length}个标签` : "选择标签"}
        <ChevronDownIcon className="ml-2 h-4 w-4" />
      </Button>

      {tagMenuOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 w-56 rounded-md border border-gray-200 bg-white shadow-lg dark:bg-gray-800">
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
  )

  // 渲染视图切换和筛选按钮
  const renderViewControls = () => (
    <div className="flex items-center gap-2">
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
    </div>
  )

  const renderFilters = () => (
    <div className="flex items-center gap-2">
      {renderCategoryDropdown()}
      {renderTagDropdown()}
      {renderViewControls()}
      {renderFilterSidebar()}
    </div>
  )

  // 返回组件
  return (
    <div className="container mx-auto py-2">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-wrap items-center gap-2 mb-4 w-full">
          {renderFilters()}
        </div>
        
        {/* 内容区域 */}
        {renderContent()}
      </div>
      
      <ThingSpeedDial />
    </div>
  )
}