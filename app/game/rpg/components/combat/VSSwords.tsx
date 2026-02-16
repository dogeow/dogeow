'use client'

/** VS 区域：可点击的 emoji，未战斗静止、战斗中播放动画 */
export function VSSwords({
  isFighting,
  isLoading,
  onToggle,
}: {
  isFighting: boolean
  isLoading: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isLoading}
      className="text-primary hover:text-primary/90 focus-visible:ring-ring flex w-fit shrink-0 flex-col items-center justify-center gap-0.5 self-center py-1 transition-colors focus:outline-none focus-visible:ring-2 disabled:opacity-50"
      title={isFighting ? '停止挂机' : '开始挂机'}
      aria-label={isFighting ? '停止挂机' : '开始挂机'}
    >
      <span
        className={`text-3xl leading-none sm:text-4xl ${isFighting ? 'vs-emoji-fighting' : ''}`}
        aria-hidden
      >
        ⚔️
      </span>
      <span className="text-primary text-xs font-bold sm:text-sm">VS</span>
    </button>
  )
}
