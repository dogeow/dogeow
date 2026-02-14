'use client'

import { useState } from 'react'
import { soundManager } from '../utils/soundManager'
import { useGameStore } from '../stores/gameStore'

interface SoundSettingsProps {
  onLogout?: () => void
}

export function SoundSettings({ onLogout }: SoundSettingsProps) {
  // 使用 lazy initialization 从 soundManager 获取初始值
  const [enabled, setEnabled] = useState(() => soundManager.isEnabled())
  const [volume, setVolume] = useState(() => soundManager.getVolume())
  const { reset } = useGameStore()

  const handleToggle = () => {
    const newState = soundManager.toggle()
    setEnabled(newState)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    soundManager.setVolume(newVolume)
    setVolume(newVolume)
  }

  const handleLogout = () => {
    soundManager.play('button_click')
    // 清除当前角色状态
    reset()
    // 调用退出回调
    onLogout?.()
  }

  return (
    <div className="bg-card border-border space-y-3 rounded-lg border p-3 sm:space-y-4 sm:p-4">
      <h3 className="text-foreground mb-3 text-lg font-bold sm:mb-4">设置</h3>

      <div className="space-y-3 sm:space-y-4">
        <div className="space-y-3">
          <h4 className="text-foreground text-base font-medium">音效设置</h4>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">启用音效</span>
            <button
              onClick={handleToggle}
              className={`h-8 w-14 rounded-full transition-colors ${
                enabled ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <div
                className={`bg-primary-foreground h-6 w-6 rounded-full transition-transform ${
                  enabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {enabled && (
            <div className="space-y-2">
              <div className="text-muted-foreground flex justify-between text-sm">
                <span>音量</span>
                <span>{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="bg-muted accent-primary h-2 w-full cursor-pointer appearance-none rounded-lg"
              />
            </div>
          )}

          <button
            onClick={() => soundManager.play('button_click')}
            className="bg-muted text-foreground hover:bg-secondary w-full rounded py-2 text-sm transition-colors"
          >
            测试音效
          </button>
        </div>

        <div className="border-border border-t pt-4">
          <button
            onClick={handleLogout}
            className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700"
          >
            退出到角色选择
          </button>
        </div>
      </div>
    </div>
  )
}
