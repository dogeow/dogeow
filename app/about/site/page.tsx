'use client'

import React from 'react'
import { Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SystemStatusList } from './components/SystemStatusList'
import { useSystemStatus } from './data/systemStatus'
import { PageContainer } from '@/components/layout'

const SiteStatusPage: React.FC = () => {
  const systemStatus = useSystemStatus()

  return (
    <PageContainer maxWidth="4xl">
      <Card className="border-0 bg-white shadow-lg dark:border-gray-800 dark:bg-neutral-900">
        <CardHeader className="border-b border-gray-200 bg-neutral-50 dark:border-gray-700 dark:bg-neutral-900/60">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100">
            <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
            网站状态
          </CardTitle>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            实时监控网站各项服务的运行状态和性能指标
          </p>
        </CardHeader>

        <CardContent className="p-6">
          <SystemStatusList statuses={systemStatus} />
        </CardContent>
      </Card>
    </PageContainer>
  )
}

export default SiteStatusPage
