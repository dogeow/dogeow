'use client'

/** VS 区域：可点击的 emoji，未战斗静止、战斗中播放动画；死亡时显示复活 */
export function VSSwords({
  isFighting,
  isLoading,
  isDead,
  onToggle,
}: {
  isFighting: boolean
  isLoading: boolean
  isDead?: boolean
  onToggle: () => void
}) {
  const isCharacterDead = isDead ?? false

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isLoading}
      className="text-primary hover:text-primary/90 focus-visible:ring-ring flex w-fit shrink-0 flex-col items-center justify-center gap-0.5 self-center py-1 transition-colors focus:outline-none focus-visible:ring-2 disabled:opacity-50"
      title={isCharacterDead ? '复活继续' : isFighting ? '停止挂机' : '开始挂机'}
      aria-label={isCharacterDead ? '复活继续' : isFighting ? '停止挂机' : '开始挂机'}
    >
      <span
        className={`flex h-8 items-center justify-center text-3xl leading-none sm:h-10 sm:text-4xl ${
          !isCharacterDead && isFighting ? 'vs-emoji-fighting' : ''
        }`}
        aria-hidden
      >
        {isCharacterDead ? '💪' : '⚔️'}
      </span>
      <span className="text-primary text-xs font-bold sm:text-sm">
        {isCharacterDead ? '复活' : isFighting ? '战斗中...' : '已停止战斗'}
      </span>
    </button>
  )
}
