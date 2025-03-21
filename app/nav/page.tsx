"use client"

import { useState, useEffect } from 'react';
import { getCategories } from './services/api';
import { NavCategory as CategoryType } from '@/types/nav';
import { NavCategory } from './components/NavCategory';
import { Folder, Search } from 'lucide-react';

export default function NavPage() {
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error('获取导航分类失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // 过滤导航项
  const filteredCategories = categories.map(category => {
    // 如果没有搜索，返回原始分类
    if (!searchTerm.trim()) return category;
    
    // 过滤分类中的导航项
    const filteredItems = category.items?.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    // 返回带有过滤后导航项的新分类对象
    return {
      ...category,
      items: filteredItems
    };
  }).filter(category => category.items && category.items.length > 0);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center gap-1">
        <Folder className="h-6 w-6" />
        <h1 className="text-2xl font-bold">我的导航</h1>
      </div>
      
      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="搜索网站..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      
      {loading ? (
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