/**
 * 游戏工具函数
 */

/**
 * 检查游戏是否结束
 */
export const isGameOver = (): boolean => {
  // 游戏结束逻辑（如果需要）
  return false
}

/**
 * 生成随机位置
 */
export const generateRandomPosition = (gameAreaSize: number): [number, number, number] => {
  return [
    (Math.random() - 0.5) * gameAreaSize,
    ((Math.random() - 0.5) * gameAreaSize) / 2 + 2,
    (Math.random() - 0.5) * gameAreaSize - gameAreaSize / 2,
  ]
}

/**
 * 生成随机方向并归一化
 */
export const generateRandomDirection = (): [number, number, number] => {
  const direction: [number, number, number] = [
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 2,
  ]

  const length = Math.sqrt(direction[0] ** 2 + direction[1] ** 2 + direction[2] ** 2)
  return [direction[0] / length, direction[1] / length, direction[2] / length]
}

/**
 * 难度设置配置
 */
export const difficultySettings = {
  easy: { targetCount: 8, targetSpeed: 0.01, gameAreaSize: 20 },
  medium: { targetCount: 12, targetSpeed: 0.02, gameAreaSize: 25 },
  hard: { targetCount: 16, targetSpeed: 0.05, gameAreaSize: 30 },
}
