'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { PageContainer } from '@/components/layout'
import { NavForm } from '../components/NavForm'

export default function AddNavPage() {
  const router = useRouter()

  return (
    <PageContainer>
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
          <h1 className="text-2xl font-bold tracking-tight">添加导航</h1>
        </div>
      </div>

      <Card className="mx-auto max-w-2xl">
        <CardContent className="pt-6">
          <NavForm />
        </CardContent>
      </Card>
    </PageContainer>
  )
}
