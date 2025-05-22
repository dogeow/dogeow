import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Globe, LockIcon, TagIcon, FolderIcon, CalendarIcon, InfoIcon, AlertTriangleIcon, Edit3Icon } from "lucide-react";
import { Item, Spot } from "@/app/thing/types";
import { formatDate } from '@/lib/helpers/dateUtils';
import { getFullImageUrl, getLocationPath } from '@/app/thing/utils'; // Import helpers

interface ItemDetailDialogProps {
  item: Item | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // getLocationPath prop removed
  onViewDetails: (id: number) => void;
}

// getFullImageUrl removed, will use imported version
// Helper for status badge, can be centralized later
const getStatusBadge = (status: string): JSX.Element => {
  let colorClass = "";
  let text = status;
  switch (status) {
    case "active":
      colorClass = "bg-green-500";
      text = "Active";
      break;
    case "idle":
      colorClass = "bg-amber-500";
      text = "Idle";
      break;
    case "expired":
      colorClass = "bg-red-500";
      text = "Expired";
      break;
    case "damaged":
      colorClass = "bg-orange-500";
      text = "Damaged";
      break;
    case "inactive":
      colorClass = "bg-gray-500";
      text = "Inactive";
      break;
    default:
      colorClass = "bg-gray-400";
  }
  return <Badge className={`${colorClass} text-white`}>{text}</Badge>;
};


export function ItemDetailDialog({
  item,
  open,
  onOpenChange,
  // getLocationPath prop removed
  onViewDetails,
}: ItemDetailDialogProps) {
  if (!item) return null;

  const imageUrl = getFullImageUrl(item);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">{item.name}</DialogTitle>
          <DialogDescription>
            {item.category?.name || "Uncategorized"}
            <span className="mx-2">•</span>
            {getStatusBadge(item.status)}
            <span className="mx-2">•</span>
            {item.is_public ? (
              <span className="inline-flex items-center">
                <Globe className="mr-1 h-4 w-4" /> Public
              </span>
            ) : (
              <span className="inline-flex items-center">
                <LockIcon className="mr-1 h-4 w-4" /> Private
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            {imageUrl ? (
              <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                <Image
                  src={imageUrl}
                  alt={item.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ) : (
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                No Image
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-1 text-sm text-muted-foreground">Description</h4>
              <p className="text-base">{item.description || "No description provided."}</p>
            </div>

            {item.tags && item.tags.length > 0 && (
              <div>
                <h4 className="font-medium mb-1.5 text-sm text-muted-foreground inline-flex items-center">
                  <TagIcon className="mr-2 h-4 w-4" /> Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <Badge key={tag.id} variant="secondary">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="font-medium mb-1.5 text-sm text-muted-foreground inline-flex items-center">
                <FolderIcon className="mr-2 h-4 w-4" /> Location
              </h4>
              <p className="text-base">{getLocationPath(item.spot) || "No location specified."}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-1.5 text-sm text-muted-foreground inline-flex items-center">
                  <CalendarIcon className="mr-2 h-4 w-4" /> Purchase Date
                </h4>
                <p className="text-base">{formatDate(item.purchase_date || "")}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1.5 text-sm text-muted-foreground inline-flex items-center">
                  <CalendarIcon className="mr-2 h-4 w-4" /> Expiry Date
                </h4>
                <p className="text-base">{formatDate(item.expiry_date || "")}</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-1.5 text-sm text-muted-foreground inline-flex items-center">
                <InfoIcon className="mr-2 h-4 w-4" /> Quantity
              </h4>
              <p className="text-base">{item.quantity ?? "N/A"}</p>
            </div>

            {item.notes && (
               <div>
                <h4 className="font-medium mb-1.5 text-sm text-muted-foreground inline-flex items-center">
                  <AlertTriangleIcon className="mr-2 h-4 w-4" /> Notes
                </h4>
                <p className="text-base whitespace-pre-wrap">{item.notes}</p>
              </div>
            )}

          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => onViewDetails(item.id)}>
            <Edit3Icon className="mr-2 h-4 w-4" /> View Full Details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
