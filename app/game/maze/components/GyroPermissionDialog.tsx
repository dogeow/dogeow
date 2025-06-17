"use client"

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Smartphone, RotateCw } from 'lucide-react'

interface GyroPermissionDialogProps {
  onRequestPermission: () => Promise<void>
}

export function GyroPermissionDialog({ onRequestPermission }: GyroPermissionDialogProps) {
  const handleRequestPermission = async () => {
    try {
      await onRequestPermission()
    } catch (error) {
      console.error('请求陀螺仪权限失败:', error)
    }
  }

  return (
    <Card className="p-6 max-w-md mx-auto bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <Smartphone className="w-12 h-12 text-blue-500" />
            <RotateCw className="w-6 h-6 text-purple-500 absolute -top-1 -right-1 animate-spin" />
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            启用陀螺仪控制
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            为了获得最佳游戏体验，我们需要访问您设备的陀螺仪传感器。
            倾斜设备即可控制小球移动！
          </p>
        </div>

        <div className="bg-white/70 rounded-lg p-3 text-xs text-slate-500">
          <div className="flex items-center space-x-2 mb-1">
            <span>📱</span>
            <span>倾斜设备左右控制小球水平移动</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🎯</span>
            <span>倾斜设备前后控制小球垂直移动</span>
          </div>
        </div>

        <Button 
          onClick={handleRequestPermission}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
        >
          启用陀螺仪控制
        </Button>

        <p className="text-xs text-slate-400">
          如果您拒绝权限，仍可使用虚拟方向键或键盘控制
        </p>
      </div>
    </Card>
  )
} 