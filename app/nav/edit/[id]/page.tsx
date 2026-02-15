'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useNavStore } from '@/app/nav/stores/navStore'
import { Card, CardContent } from '@/components/ui/card'
import { PageContainer } from '@/components/layout'
import { NavForm } from '../../components/NavForm'
import { NavItem } from '@/app/nav/types'

export default function EditNavPage() {
  const params = useParams()
  const router = useRouter()
  const { fetchAllCategories, fetchItems } = useNavStore()
  const [loading, setLoading] = useState(true)
  const [item, setItem] = useState<NavItem | null>(null)
  const itemId = Number(params.id)

  // 加载数据
  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        const [, itemsResult] = await Promise.all([fetchAllCategories(), fetchItems()])
        const currentItem = itemsResult.find(i => i.id === itemId)

        if (!currentItem) {
          toast.error('找不到导航项')
          router.push('/nav')
          return
        }

        if (isMounted) {
          setItem(currentItem)
        }
      } catch (error) {
        console.error('加载数据失败:', error)
        if (isMounted) {
          toast.error('加载数据失败')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [fetchAllCategories, fetchItems, itemId, router])

  if (loading) {
    return (
      <PageContainer className="py-2">
        <div className="flex h-40 items-center justify-center">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer className="py-2">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/nav')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">编辑导航</h1>
        </div>
      </div>

      <Card className="mx-auto max-w-2xl">
        <CardContent className="pt-6">{item && <NavForm item={item} />}</CardContent>
      </Card>
    </PageContainer>
  )
}
