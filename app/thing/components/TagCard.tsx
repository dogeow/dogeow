import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn, isLightColor } from '@/lib/utils';
import { Tag } from '../types';

interface TagCardProps {
  tag: Partial<Tag> & {
    id: string | number;
    name: string;
  };
  count?: number;
  onDelete?: () => void;
  className?: string;
}

export default function TagCard({ tag, count, onDelete, className }: TagCardProps) {
  // 防止渲染错误
  if (!tag?.name) return null;
  
  // 设置标签样式
  const tagStyle = {
    backgroundColor: tag.color || "#3b82f6",
    color: isLightColor(tag.color || "#3b82f6") ? '#000' : '#fff',
    borderColor: 'transparent'
  };

  return (
    <Card className={cn("p-0 shadow-sm hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-0">
        <div className="flex items-center">
          <Badge
            style={tagStyle}
            className="rounded-r-none text-xs font-medium px-2 py-0.5 h-full flex-grow"
          >
            {tag.name}
            {count !== undefined && <span className="ml-1 opacity-80">{count}</span>}
          </Badge>
          
          {onDelete && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
              }}
              className="group bg-white flex items-center justify-center h-full p-0.5 rounded-r-md border border-l-0 hover:bg-gray-100"
            >
              <X className="h-3 w-3 text-gray-500 group-hover:text-gray-700" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}