'use client'

import { Card, CardContent } from '@/components/ui/card'

const ToolPlaceholder = () => {
  return (
    <Card className="border-border/60 bg-muted/20 shadow-sm">
      <CardContent className="flex min-h-[240px] flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-base font-semibold">功能开发中</p>
        <p className="text-muted-foreground text-sm">该工具正在建设，敬请期待。</p>
      </CardContent>
    </Card>
  )
}

export default ToolPlaceholder
