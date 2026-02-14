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
    <div className="space-y-3 rounded-lg bg-gray-800 p-3 sm:space-y-4 sm:p-4">
      <h3 className="mb-3 text-lg font-bold text-white sm:mb-4">设置</h3>

      <div className="space-y-3 sm:space-y-4">
        <div className="space-y-3">
          <h4 className="text-base font-medium text-white">音效设置</h4>

          <div className="flex items-center justify-between">
            <span className="text-gray-300">启用音效</span>
            <button
              onClick={handleToggle}
              className={`h-8 w-14 rounded-full transition-colors ${
                enabled ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <div
                className={`h-6 w-6 rounded-full bg-white transition-transform ${
                  enabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {enabled && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
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
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-blue-600"
              />
            </div>
          )}

          <button
            onClick={() => soundManager.play('button_click')}
            className="w-full rounded bg-gray-700 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-600"
          >
            测试音效
          </button>
        </div>

        <div className="border-t border-gray-700 pt-4">
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
