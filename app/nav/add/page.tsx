'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { PageContainer, PageHeader } from '@/components/layout'
import { NavForm } from '../components/NavForm'

export default function AddNavPage() {
  const router = useRouter()

  return (
    <PageContainer>
      <PageHeader
        title="添加导航"
        description="填写站点名称、链接与分类信息。"
        showBackButton
        onBackClick={() => router.push('/nav')}
      />

      <Card className="mx-auto max-w-2xl">
        <CardContent className="pt-6">
          <NavForm />
        </CardContent>
      </Card>
    </PageContainer>
  )
}
