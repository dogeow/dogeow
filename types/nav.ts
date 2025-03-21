export interface NavCategory {
  id: number;
  name: string;
  icon: string | null;
  description: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  items?: NavItem[];
  items_count?: number;
}

export interface NavItem {
  id: number;
  nav_category_id: number;
  name: string;
  url: string;
  icon: string | null;
  description: string | null;
  sort_order: number;
  is_visible: boolean;
  is_new_window: boolean;
  clicks: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  category?: NavCategory;
} 