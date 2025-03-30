"use client"

import { NavItem } from '@/app/nav/types';
import { ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { recordClick } from '../services/api';

type NavCardProps = {
  item: NavItem;
};

export function NavCard({ item }: NavCardProps) {
  const [clicks, setClicks] = useState(item.clicks);

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    try {
      const response = await recordClick(item.id);
      setClicks(response.clicks);
    } catch (error) {
      console.error('记录点击失败:', error);
    }
  };

  return (
    <div 
      className="group relative flex flex-col overflow-hidden rounded-lg border p-2 transition-all hover:border-foreground/20 hover:shadow-md"
      style={{ height: '100%' }}
    >
      <div className="flex items-center gap-2">
        {item.icon && (
          <div className="h-5 w-5 flex-shrink-0">
            <img src={item.icon} alt={`${item.name} 图标`} className="h-full w-full object-contain" />
          </div>
        )}
        <a
          href={item.url}
          target={item.is_new_window ? "_blank" : "_self"}
          rel="noopener noreferrer"
          className="flex-1 font-medium text-blue-600 hover:underline"
          onClick={handleClick}
        >
          {item.name}
          {item.is_new_window && (
            <ExternalLink className="ml-1 inline-block h-3 w-3" />
          )}
        </a>
      </div>
      
      {item.description && (
        <p className="mt-1 text-xs text-gray-500 line-clamp-2">{item.description}</p>
      )}
      
      <div className="mt-auto pt-1 text-xs text-gray-400">
        点击: {clicks}
      </div>
    </div>
  );
} 