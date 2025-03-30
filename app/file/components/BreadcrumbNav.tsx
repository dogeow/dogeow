'use client'

import { useEffect, useState } from 'react'
import { ChevronRight, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CloudFile } from '../types'
import { apiRequest, API_BASE_URL } from '@/utils/api'
import useFileStore from '../store/useFileStore'

interface Breadcrumb {
  id: number
  name: string
}

export default function BreadcrumbNav() {
  const { currentFolderId, navigateToFolder } = useFileStore()
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchBreadcrumbs = async (folderId: number | null) => {
    if (!folderId) {
      setBreadcrumbs([])
      return
    }

    setIsLoading(true)
    try {
      const breadcrumbList: Breadcrumb[] = []
      let currentId: number | null = folderId

      while (currentId) {
        const folder: CloudFile = await apiRequest<CloudFile>(
          `${API_BASE_URL}/cloud/files/${currentId}`
        )
        
        breadcrumbList.unshift({
          id: folder.id,
          name: folder.name
        })
        
        currentId = folder.parent_id
      }

      setBreadcrumbs(breadcrumbList)
    } catch (error) {
      console.error('Failed to fetch breadcrumbs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBreadcrumbs(currentFolderId)
  }, [currentFolderId])

  return (
    <div className="flex items-center text-sm mt-4">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2"
        onClick={() => navigateToFolder(null)}
      >
        <Home className="h-4 w-4 mr-1" />
        主目录
      </Button>

      {breadcrumbs.length > 0 && (
        <>
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.id} className="flex items-center">
              <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => navigateToFolder(crumb.id)}
              >
                {crumb.name}
              </Button>
            </div>
          ))}
        </>
      )}

      {isLoading && (
        <div className="animate-pulse ml-2 h-2 w-16 bg-muted rounded"></div>
      )}
    </div>
  )
} 