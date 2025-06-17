import { create } from 'zustand'

export interface Ball {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

export interface MazeCell {
  x: number
  y: number
  walls: {
    top: boolean
    right: boolean
    bottom: boolean
    left: boolean
  }
  visited: boolean
}

export interface GameState {
  // 游戏状态
  isPlaying: boolean
  isPaused: boolean
  gameWon: boolean
  gameTime: number
  level: number
  
  // 迷宫配置
  mazeSize: number
  cellSize: number
  maze: MazeCell[][]
  
  // 小球状态
  ball: Ball
  
  // 陀螺仪数据
  gyroSupported: boolean
  gyroPermission: boolean
  tiltX: number
  tiltY: number
  
  // 控制设置
  sensitivity: number
  friction: number
  
  // 游戏动作
  startGame: () => void
  pauseGame: () => void
  resumeGame: () => void
  resetGame: () => void
  nextLevel: () => void
  
  // 小球控制
  updateBall: (deltaTime: number) => void
  moveBall: (dx: number, dy: number) => void
  
  // 陀螺仪控制
  updateTilt: (x: number, y: number) => void
  requestGyroPermission: () => Promise<void>
  
  // 迷宫生成
  generateMaze: () => void
  
  // 设置
  setSensitivity: (value: number) => void
  setLevel: (level: number) => void
}

export const useMazeStore = create<GameState>((set, get) => ({
  // 初始状态
  isPlaying: false,
  isPaused: false,
  gameWon: false,
  gameTime: 0,
  level: 1,
  
  // 迷宫配置
  mazeSize: 15,
  cellSize: 20,
  maze: [],
  
  // 小球初始状态
  ball: {
    x: 25,
    y: 25,
    vx: 0,
    vy: 0,
    radius: 8
  },
  
  // 陀螺仪状态
  gyroSupported: false,
  gyroPermission: false,
  tiltX: 0,
  tiltY: 0,
  
  // 控制设置
  sensitivity: 0.3,
  friction: 0.95,
  
  // 游戏控制
  startGame: () => {
    const state = get()
    get().generateMaze()
    set({
      isPlaying: true,
      isPaused: false,
      gameWon: false,
      gameTime: 0,
      ball: {
        ...state.ball,
        x: state.cellSize + state.ball.radius,
        y: state.cellSize + state.ball.radius,
        vx: 0,
        vy: 0
      }
    })
  },
  
  pauseGame: () => set({ isPaused: true }),
  resumeGame: () => set({ isPaused: false }),
  
  resetGame: () => {
    const state = get()
    set({
      isPlaying: false,
      isPaused: false,
      gameWon: false,
      gameTime: 0,
      ball: {
        ...state.ball,
        x: state.cellSize + state.ball.radius,
        y: state.cellSize + state.ball.radius,
        vx: 0,
        vy: 0
      }
    })
  },
  
  nextLevel: () => {
    const state = get()
    set({ level: state.level + 1 })
    get().startGame()
  },
  
  // 简化的更新函数，不再需要物理动画
  updateBall: () => {
    // 现在使用直接移动，不需要持续更新
    // 这个函数保留是为了兼容性，但实际上不做任何事情
    return
  },
  
  moveBall: (dx: number, dy: number) => {
    const state = get()
    console.log('moveBall调用:', { dx, dy, isPlaying: state.isPlaying, isPaused: state.isPaused })
    
    if (!state.isPlaying || state.isPaused) {
      console.log('moveBall: 游戏未开始或已暂停')
      return
    }
    
    // 改为直接移动，不使用物理动画
    const moveDistance = state.cellSize / 4 // 每次移动1/4格子
    const newX = state.ball.x + dx * moveDistance
    const newY = state.ball.y + dy * moveDistance
    
    // 边界检测
    const { cellSize, mazeSize, ball } = state
    const minX = ball.radius
    const maxX = mazeSize * cellSize - ball.radius
    const minY = ball.radius
    const maxY = mazeSize * cellSize - ball.radius
    
    const clampedX = Math.max(minX, Math.min(maxX, newX))
    const clampedY = Math.max(minY, Math.min(maxY, newY))
    
    // 墙壁碰撞检测
    const collision = checkWallCollision(clampedX, clampedY, ball, state.maze, cellSize)
    
    const finalX = collision.x ? state.ball.x : clampedX
    const finalY = collision.y ? state.ball.y : clampedY
    
    console.log('直接移动小球:', { 
      oldPos: { x: state.ball.x, y: state.ball.y },
      newPos: { x: finalX, y: finalY },
      collision
    })
    
    // 检查是否到达终点
    const endX = (mazeSize - 1) * cellSize + cellSize / 2
    const endY = (mazeSize - 1) * cellSize + cellSize / 2
    const distance = Math.sqrt((finalX - endX) ** 2 + (finalY - endY) ** 2)
    
    if (distance < ball.radius + 10) {
      set({ gameWon: true, isPlaying: false })
      console.log('🎉 到达终点！')
    }
    
    set({
      ball: {
        ...state.ball,
        x: finalX,
        y: finalY,
        vx: 0, // 重置速度
        vy: 0
      }
    })
  },
  
  // 陀螺仪控制
  updateTilt: (x: number, y: number) => {
    const state = get()
    set({ tiltX: x, tiltY: y })
    
    if (state.isPlaying && !state.isPaused) {
      const force = state.sensitivity
      get().moveBall(x * force, y * force)
    }
  },
  
  requestGyroPermission: async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && 'requestPermission' in DeviceOrientationEvent) {
      try {
        const permission = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission()
        set({ 
          gyroPermission: permission === 'granted',
          gyroSupported: true
        })
      } catch (error) {
        console.error('陀螺仪权限请求失败:', error)
        set({ gyroSupported: false })
      }
    } else {
      set({ gyroSupported: true, gyroPermission: true })
    }
  },
  
  // 迷宫生成（递归回溯算法）
  generateMaze: () => {
    const state = get()
    const size = state.mazeSize
    const maze: MazeCell[][] = []
    
    // 初始化迷宫
    for (let y = 0; y < size; y++) {
      maze[y] = []
      for (let x = 0; x < size; x++) {
        maze[y][x] = {
          x,
          y,
          walls: { top: true, right: true, bottom: true, left: true },
          visited: false
        }
      }
    }
    
    // 递归回溯生成迷宫
    const stack: MazeCell[] = []
    const current = maze[0][0]
    current.visited = true
    stack.push(current)
    
    while (stack.length > 0) {
      const current = stack[stack.length - 1]
      const neighbors = getUnvisitedNeighbors(current, maze, size)
      
      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)]
        removeWall(current, next)
        next.visited = true
        stack.push(next)
      } else {
        stack.pop()
      }
    }
    
    // 确保起点和终点是开放的
    maze[0][0].walls.left = false
    maze[size - 1][size - 1].walls.right = false
    
    set({ maze })
  },
  
  // 设置
  setSensitivity: (value: number) => set({ sensitivity: value }),
  setLevel: (level: number) => set({ level })
}))

// 辅助函数
function getUnvisitedNeighbors(cell: MazeCell, maze: MazeCell[][], size: number): MazeCell[] {
  const neighbors: MazeCell[] = []
  const { x, y } = cell
  
  if (y > 0 && !maze[y - 1][x].visited) neighbors.push(maze[y - 1][x]) // 上
  if (x < size - 1 && !maze[y][x + 1].visited) neighbors.push(maze[y][x + 1]) // 右
  if (y < size - 1 && !maze[y + 1][x].visited) neighbors.push(maze[y + 1][x]) // 下
  if (x > 0 && !maze[y][x - 1].visited) neighbors.push(maze[y][x - 1]) // 左
  
  return neighbors
}

function removeWall(current: MazeCell, next: MazeCell) {
  const dx = current.x - next.x
  const dy = current.y - next.y
  
  if (dx === 1) {
    current.walls.left = false
    next.walls.right = false
  } else if (dx === -1) {
    current.walls.right = false
    next.walls.left = false
  } else if (dy === 1) {
    current.walls.top = false
    next.walls.bottom = false
  } else if (dy === -1) {
    current.walls.bottom = false
    next.walls.top = false
  }
}

function checkWallCollision(x: number, y: number, ball: Ball, maze: MazeCell[][], cellSize: number) {
  const collision = { x: false, y: false }
  
  // 如果迷宫还没有生成，不进行碰撞检测
  if (!maze.length || !maze[0]) {
    return collision
  }
  
  // 计算小球所在的格子
  const cellX = Math.floor(x / cellSize)
  const cellY = Math.floor(y / cellSize)
  
  if (cellX < 0 || cellX >= maze[0].length || cellY < 0 || cellY >= maze.length) {
    return collision
  }
  
  const cell = maze[cellY][cellX]
  const ballLeft = x - ball.radius
  const ballRight = x + ball.radius
  const ballTop = y - ball.radius
  const ballBottom = y + ball.radius
  
  const cellLeft = cellX * cellSize
  const cellRight = (cellX + 1) * cellSize
  const cellTop = cellY * cellSize
  const cellBottom = (cellY + 1) * cellSize
  
  // 检查墙壁碰撞
  if (cell.walls.left && ballLeft < cellLeft) collision.x = true
  if (cell.walls.right && ballRight > cellRight) collision.x = true
  if (cell.walls.top && ballTop < cellTop) collision.y = true
  if (cell.walls.bottom && ballBottom > cellBottom) collision.y = true
  
  return collision
} 