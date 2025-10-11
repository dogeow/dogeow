interface GameUIProps {
  score: number
  timeLeft: number
  gameOver: boolean
  onRestart: () => void
}

/**
 * 游戏状态UI组件
 * 显示分数、时间和游戏结束界面
 */
export function GameUI({ score, timeLeft, gameOver, onRestart }: GameUIProps) {
  return (
    <div className="pointer-events-none fixed inset-0">
      <div className="w-full px-4 pt-16">
        <div className="mx-auto flex max-w-3xl justify-between">
          <div className="rounded-lg bg-black/80 p-2 px-4 font-medium text-white shadow-lg">
            得分: {score}
          </div>
          <div className="rounded-lg bg-black/80 p-2 px-4 font-medium text-white shadow-lg">
            时间: {timeLeft.toFixed(1)}s
          </div>
        </div>
      </div>

      {gameOver && (
        <div className="pointer-events-auto fixed inset-0 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-sm rounded-lg bg-white p-6">
            <h2 className="mb-2 text-2xl font-bold">游戏结束</h2>
            <p className="mb-4">你的最终得分: {score}</p>
            <button
              className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              onClick={onRestart}
            >
              再来一局
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
