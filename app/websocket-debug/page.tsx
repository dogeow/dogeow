'use client'

import { WebSocketConnectionDiagnostic } from '@/components/debug/WebSocketConnectionDiagnostic'

export default function WebSocketDebugPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">WebSocket 连接调试</h1>
          <p className="text-muted-foreground mt-2">诊断和修复 WebSocket 连接问题</p>
        </div>

        <WebSocketConnectionDiagnostic />
      </div>
    </div>
  )
}
