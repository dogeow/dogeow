"use client"

// import { useState } from 'react'; // No longer needed for confirmOpen, loading
import { Card, CardContent } from "@/components/ui/card"
import { NavItem } from '@/app/nav/types';
import { useNavStore } from '@/app/nav/stores/navStore';
// import { useRouter } from 'next/navigation'; // Moved to NavCardActions
import { ExternalLink, AlertTriangleIcon } from 'lucide-react';
// import { 
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu" // Moved to NavCardActions
// import { DeleteConfirmationDialog } from "@/components/ui/DeleteConfirmationDialog" // Moved to NavCardActions
// import { Button } from '@/components/ui/button'; // Button for dropdown trigger moved
// import { toast } from 'sonner'; // Toast for delete moved to NavCardActions
import NavCardActions from './NavCardActions';

interface NavCardProps {
  item: NavItem;
}

export function NavCard({ item }: NavCardProps) {
  // const router = useRouter(); // Moved to NavCardActions
  const { recordClick, deleteItem } = useNavStore();
  // const [confirmOpen, setConfirmOpen] = useState(false); // Moved to NavCardActions
  // const [loading, setLoading] = useState(false); // Moved to NavCardActions
  
  // 记录点击
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault();
      visitSite();
    }
  };
  
  // 访问网站
  const visitSite = async () => {
    try {
      await recordClick(item.id);
      
      // 在新窗口打开链接
      if (item.is_new_window) {
        window.open(item.url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = item.url;
      }
    } catch (error) {
      console.error('访问失败:', error);
    }
  };
  
  // Edit and delete handlers are now in NavCardActions

  return (
    // DeleteConfirmationDialog is now inside NavCardActions, so the fragment <> might not be needed
    // if NavCardActions doesn't require being at the same level for a dialog portal.
    // For now, keeping it, but it might be removable.
    // Update: NavCardActions returns a fragment, so this outer fragment is fine.
    <> 
      <Card className="overflow-hidden hover:shadow-md transition-shadow py-1">
        <CardContent className="p-3 relative flex items-center"> {/* Added items-center for vertical alignment */}
          <div className="mr-3 flex-shrink-0">
            <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center">
              {item.icon ? (
                <img src={item.icon} alt={`${item.name} 图标`} className="max-h-full max-w-full" />
              ) : (
                <AlertTriangleIcon className="w-1/2 h-1/2 opacity-50" />
              )}
            </div>
          </div>
          
          <div className="flex-grow min-w-0">
            <a 
              href={item.url} 
              target={item.is_new_window ? "_blank" : "_self"} 
              rel="noopener noreferrer"
              onClick={handleClick}
              className="block"
            >
              <h3 className="font-medium text-base truncate">{item.name}</h3>
              {item.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
              )}
            </a>
          </div>
          
          <div className="ml-auto flex-shrink-0 pl-2"> {/* Added pl-2 for spacing */}
            <NavCardActions item={item} deleteItem={deleteItem} />
          </div>
        </CardContent>
      </Card>
      
      {/* DeleteConfirmationDialog is now rendered by NavCardActions */}
    </>
  );
}