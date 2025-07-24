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
    id: img.id,
  }))
}

/**
 * 构建位置路径字符串
 */
export function buildLocationPath(areaName?: string, roomName?: string, spotName?: string): string {
  const parts = [areaName, roomName, spotName].filter(Boolean)
  return parts.join(' / ')
}

/**
 * 深度比较两个值是否相等
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  
  if (a == null || b == null) return a === b
  
  if (typeof a !== typeof b) return false
  
  if (typeof a !== 'object') return a === b
  
  if (Array.isArray(a) !== Array.isArray(b)) return false
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false
    }
    return true
  }
  
  // 处理 Date 对象
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime()
  }
  
  if (a instanceof Date || b instanceof Date) return false
  
  // 确保 a 和 b 都是对象
  const objA = a as Record<string, unknown>
  const objB = b as Record<string, unknown>
  
  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)
  
  if (keysA.length !== keysB.length) return false
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false
    if (!deepEqual(objA[key], objB[key])) return false
  }
  
  return true
}

/**
 * 检查数据是否有变化
 */
export function hasDataChanged<T>(current: T, initial: T): boolean {
  const hasChanges = !deepEqual(current, initial)
  
  console.log('数据变化详细检查:', {
    hasChanges,
    current,
    initial,
    currentFormData: (current as Record<string, unknown>)?.formData,
    initialFormData: (initial as Record<string, unknown>)?.formData,
    currentTags: (current as Record<string, unknown>)?.selectedTags,
    initialTags: (initial as Record<string, unknown>)?.selectedTags
  })
  
  return hasChanges
}

/**
 * 将标签数组转换为ID字符串数组
 */
export function tagsToIdStrings(tags: Tag[]): string[] {
  return tags.map(tag => tag.id.toString())
}
