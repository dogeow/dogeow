export interface CloudFile {
  id: number;
  name: string;
  type: string;
  size: number;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
  url?: string;
  thumbnail_url?: string;
}

export interface FolderNode {
  id: number;
  name: string;
  parent_id: number | null;
  children?: FolderNode[];
  created_at: string;
  updated_at: string;
} 