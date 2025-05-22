export interface CloudFile {
  id: number;
  name: string;
  original_name: string | null;
  path: string;
  mime_type: string | null;
  extension: string | null;
  size: number;
  parent_id: number | null;
  user_id: number;
  is_folder: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
  type: 'folder' | 'image' | 'pdf' | 'document' | 'spreadsheet' | 'archive' | 'audio' | 'video' | 'other';
  url?: string;
  thumbnail_url?: string;
}

export interface FolderNode {
  id: number;
  name: string;
  children: FolderNode[];
} 