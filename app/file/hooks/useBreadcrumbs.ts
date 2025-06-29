import useSWR from 'swr'
import { CloudFile } from '../types'
import { get } from '@/lib/api'

interface Breadcrumb {
  id: number
  name: string
}

// SWR fetcher 函数
const fetchBreadcrumbs = async (folderId: number): Promise<Breadcrumb[]> => {
  const breadcrumbList: Breadcrumb[] = []
  let currentId: number | null = folderId

  while (currentId) {
    const folder: CloudFile = await get<CloudFile>(`cloud/files/${currentId}`)
    
    breadcrumbList.unshift({
      id: folder.id,
      name: folder.name
    })
    
    currentId = folder.parent_id
  }

  return breadcrumbList
}

export const useBreadcrumbs = (currentFolderId: number | null) => {
  return useSWR(
    currentFolderId ? `breadcrumbs-${currentFolderId}` : null,
    () => fetchBreadcrumbs(currentFolderId!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1分钟内不重复请求
      errorRetryCount: 2,
      errorRetryInterval: 1000,
      keepPreviousData: true, // 保持之前的数据直到新数据加载完成
    }
  )
}

export type { Breadcrumb } 