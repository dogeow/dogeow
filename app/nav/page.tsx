"use client"

import { useState, useEffect } from 'react';
import { NavCategory as CategoryType } from '@/app/nav/types';
import { NavCategory } from './components/NavCategory';
import { Folder, Search, Plus, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useNavStore } from '@/app/nav/stores/navStore';

export default function NavPage() {
  const router = useRouter();
  const { categories, loading: storeLoading, fetchCategories } = useNavStore();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | number>('all');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchCategories();
      } catch (error) {
        console.error('获取导航分类失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [fetchCategories]);
  
  // 分类侧边栏
  const renderCategorySidebar = () => (
    <aside className="w-20 shrink-0 flex flex-col gap-0 py-2">
      <button
        className={`px-2 py-1 rounded text-left font-bold text-sm ${selectedCategory === 'all' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
        onClick={() => setSelectedCategory('all')}
      >全部</button>
      {categories.map((cat: any) => (
        <button
          key={cat.id}
          className={`px-2 py-1 rounded text-left text-sm ${selectedCategory === cat.id ? 'bg-blue-500 text-white font-bold' : 'hover:bg-gray-100'}`}
          onClick={() => setSelectedCategory(cat.id)}
        >{cat.name}</button>
      ))}
    </aside>
  );

  // 分类筛选
  const filteredCategories = categories
    .filter(category => selectedCategory === 'all' || category.id === selectedCategory)
    .map(category => {
      if (!searchTerm.trim()) return category;
      const filteredItems = category.items?.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      return { ...category, items: filteredItems };
    })
    .filter(category => category.items && category.items.length > 0);

  const handleAddNav = () => {
    router.push('/nav/add');
  };

  const handleManageCategories = () => {
    router.push('/nav/categories');
  };

  return (
    <div className="flex">
      {renderCategorySidebar()}
      <div className="flex-1 flex flex-col gap-2 mx-2">
        <div className="flex items-center">
          <div className="flex items-center gap-1 mt-2">
            <Folder className="h-6 w-6" />
            <h1 className="text-2xl font-bold">我的导航</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button 
              onClick={handleManageCategories} 
              size="sm" 
              variant="outline"
              className="flex items-center gap-1"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">管理分类</span>
            </Button>
            <Button onClick={handleAddNav} size="sm" variant="default" className="bg-green-500 hover:bg-green-600">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="relative max-w-md">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="搜索网站..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        
        {loading || storeLoading ? (
          <LoadingSkeleton />
        ) : filteredCategories.length > 0 ? (
          filteredCategories.map((category) => (
            <NavCategory key={category.id} category={category} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-xl font-semibold text-gray-700">没有找到匹配的导航</p>
            <p className="mt-2 text-gray-500">
              {searchTerm ? '请尝试其他搜索词' : '请添加一些导航分类和导航项'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div>
      {[1, 2].map((i) => (
        <div key={i} className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-gray-200 animate-pulse" />
            <div className="h-7 w-40 bg-gray-200 animate-pulse" />
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map((j) => (
              <div key={j} className="h-24 rounded-lg bg-gray-200 animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}