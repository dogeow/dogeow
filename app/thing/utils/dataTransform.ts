import { ItemImage, UploadedImage, Tag } from '@/app/thing/types'

/**
 * 将现有图片转换为上传图片格式
 */
export function convertImagesToUploadedFormat(images: ItemImage[]): UploadedImage[] {
  return images.map((img: ItemImage) => ({
    path: img.path || '', 
    thumbnail_path: img.thumbnail_path || '',
    url: img.url || '',
    thumbnail_url: img.thumbnail_url || '',
    id: img.id
  }))
}

/**
 * 构建位置路径字符串
 */
export function buildLocationPath(
  areaName?: string, 
  roomName?: string, 
  spotName?: string
): string {
  const parts = [areaName, roomName, spotName].filter(Boolean)
  return parts.join(' / ')
}

/**
 * 检查数据是否有变化
 */
export function hasDataChanged<T>(current: T, initial: T): boolean {
  return JSON.stringify(current) !== JSON.stringify(initial)
}

/**
 * 将标签数组转换为ID字符串数组
 */
export function tagsToIdStrings(tags: Tag[]): string[] {
  return tags.map(tag => tag.id.toString())
} 