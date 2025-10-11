/**
 * 2048游戏棋盘组件
 */
import { Card } from '@/components/ui/card'

interface GameBoardProps {
  board: number[][]
  getTileColor: (value: number) => string
}

export function GameBoard({ board, getTileColor }: GameBoardProps) {
  return (
    <Card className="mb-4 p-4">
      <div className="grid grid-cols-4 gap-2" style={{ touchAction: 'none' }} data-game-board>
        {board.map((row, i) =>
          row.map((cell, j) => (
            <div
              key={`${i}-${j}`}
              className={`flex aspect-square items-center justify-center rounded-lg ${cell >= 1000 ? 'text-sm' : cell >= 100 ? 'text-base' : 'text-lg'} font-bold transition-all duration-200 ease-in-out ${getTileColor(cell)} ${cell !== 0 ? 'scale-100' : 'scale-95'} hover:scale-105`}
            >
              {cell !== 0 && (
                <span className="animate-in fade-in-0 zoom-in-95 duration-200">{cell}</span>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
