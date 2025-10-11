/**
 * 2048自动运行控制组件
 */
import { Button } from '@/components/ui/button'

type SpeedOption = { value: number; label: string }
type Direction = 'up' | 'down' | 'left' | 'right'

interface AutoRunControlsProps {
  speed: number
  isAutoRunning: boolean
  isDirectionalRunning: boolean
  isClockwise: boolean
  currentDirection: Direction
  disabled: boolean
  onSpeedChange: (speed: number) => void
  onToggleAutoRun: () => void
  onToggleDirectionalRun: () => void
  onToggleClockwise: () => void
}

const SPEED_OPTIONS: SpeedOption[] = [
  { value: 1, label: '不能再快了' },
  { value: 200, label: '快' },
  { value: 500, label: '正常' },
  { value: 1000, label: '慢' },
]

const DIRECTION_SYMBOLS = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
} as const

export function AutoRunControls({
  speed,
  isAutoRunning,
  isDirectionalRunning,
  isClockwise,
  currentDirection,
  disabled,
  onSpeedChange,
  onToggleAutoRun,
  onToggleDirectionalRun,
  onToggleClockwise,
}: AutoRunControlsProps) {
  return (
    <div className="mb-6 space-y-3">
      <div className="text-center">
        <div className="mb-3">
          <div className="flex flex-wrap justify-center gap-1">
            {SPEED_OPTIONS.map(option => (
              <Button
                key={option.value}
                variant={speed === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => onSpeedChange(option.value)}
                disabled={disabled}
                className="px-2 py-1 text-xs"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center space-x-2">
          <Button
            variant={isAutoRunning ? 'destructive' : 'default'}
            size="default"
            onClick={onToggleAutoRun}
            disabled={disabled || isDirectionalRunning}
            className="px-4 text-sm"
          >
            {isAutoRunning ? '🛑' : '🎲'}
          </Button>

          <span className="text-gray-400">|</span>

          <Button
            variant="outline"
            size="sm"
            onClick={onToggleClockwise}
            disabled={disabled || isAutoRunning}
            className="px-2 text-xs"
          >
            {isClockwise ? '🔄' : '🔃'}
          </Button>

          <Button
            variant={isDirectionalRunning ? 'destructive' : 'default'}
            size="default"
            onClick={onToggleDirectionalRun}
            disabled={disabled || isAutoRunning}
            className="px-4 text-sm"
          >
            {isDirectionalRunning ? '🛑' : '🔄'}
          </Button>
        </div>

        {(isAutoRunning || isDirectionalRunning) && (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            {isAutoRunning && <div>🎲 随机运行中...</div>}
            {isDirectionalRunning && (
              <div>
                🔄 {isClockwise ? '顺时针' : '逆时针'}循环中
                <span className="ml-1 font-mono text-lg">
                  ({DIRECTION_SYMBOLS[currentDirection]})
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
