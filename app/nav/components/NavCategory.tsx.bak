"use client"

import { NavCategory as CategoryType } from '@/app/nav/types';
import { NavCard } from './NavCard';

type NavCategoryProps = {
  category: CategoryType;
};

export function NavCategory({ category }: NavCategoryProps) {
  if (!category.items || category.items.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center gap-2">
        {category.icon && (
          <div className="h-6 w-6">
            <img src={category.icon} alt={`${category.name} 图标`} className="h-full w-full object-contain" />
          </div>
        )}
        <h2 className="text-xl font-bold">{category.name}</h2>
      </div>
      
      {category.description && (
        <p className="mb-4 text-sm text-gray-500">{category.description}</p>
      )}
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {category.items.map((item) => (
          <NavCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
} 