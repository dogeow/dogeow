'use client'

import { useCallback, useState, memo } from 'react'
import { soundManager } from '../../utils/soundManager'
import { useGameStore } from '../../stores/gameStore'

interface SoundSettingsProps {
  onLogout?: () => void
}

const SoundSettingsInner = ({ onLogout }: SoundSettingsProps) => {
  // 懒初始化音效状态和音量
  const [enabled, setEnabled] = useState(() => soundManager.isEnabled())
  const [volume, setVolume] = useState(() => soundManager.getVolume())
  const { reset } = useGameStore()

  const handleToggle = useCallback(() => {
    const newState = soundManager.toggle()
    setEnabled(newState)
  }, [])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    soundManager.setVolume(newVolume)
    setVolume(newVolume)
  }, [])

  const handleTestSound = useCallback(() => {
    soundManager.play('button_click')
  }, [])

  const handleLogout = useCallback(() => {
    soundManager.play('button_click')
    reset()
    onLogout?.()
  }, [reset, onLogout])

  return (
    <div className="bg-card border-border space-y-3 rounded-lg border p-3 sm:space-y-4 sm:p-4">
      <h3 className="text-foreground mb-3 text-lg font-bold sm:mb-4">设置</h3>
      <div className="space-y-3 sm:space-y-4">
        <div className="space-y-3">
          <h4 className="text-foreground text-sm font-medium">音效设置</h4>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">启用音效</span>
            <button
              onClick={handleToggle}
              aria-pressed={enabled}
              aria-label={enabled ? '关闭音效' : '开启音效'}
              className={`focus:ring-primary/60 h-8 w-14 rounded-full transition-colors focus:ring-2 focus:outline-none ${
                enabled ? 'bg-primary' : 'bg-muted'
              }`}
              type="button"
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
                <span aria-live="polite">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                aria-valuenow={volume}
                aria-valuemin={0}
                aria-valuemax={1}
                aria-label="音量"
                className="bg-muted accent-primary h-2 w-full cursor-pointer appearance-none rounded-lg"
              />
            </div>
          )}

          <button
            onClick={handleTestSound}
            type="button"
            className="bg-muted text-foreground hover:bg-secondary w-full rounded py-2 text-sm transition-colors"
          >
            测试音效
          </button>
        </div>

        <div className="border-border border-t pt-4">
          <button
            onClick={handleLogout}
            type="button"
            className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700"
          >
            退出到角色选择
          </button>
        </div>
      </div>
    </div>
  )
}

export const SoundSettings = memo(SoundSettingsInner)
