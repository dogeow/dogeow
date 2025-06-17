import { create } from 'zustand'

export interface Ball {
  x: number
  y: number
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
  
  // 陀螺仪设置
  sensitivity: number
  gyroSupported: boolean
  gyroPermission: boolean
  tiltX: number
  tiltY: number
  
  // 游戏动作
  startGame: () => void
  pauseGame: () => void
  resumeGame: () => void
  resetGame: () => void
  nextLevel: () => void
  
  // 小球控制 - 智能移动到岔口
  moveBall: (direction: 'up' | 'down' | 'left' | 'right') => void
  
  // 迷宫生成
  generateMaze: () => void
  
  // 设置
  setLevel: (level: number) => void
  setSensitivity: (sensitivity: number) => void
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
    radius: 8
  },
  
  // 陀螺仪设置
  sensitivity: 0.5,
  gyroSupported: false,
  gyroPermission: false,
  tiltX: 0,
  tiltY: 0,
  
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
        y: state.cellSize + state.ball.radius
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
        y: state.cellSize + state.ball.radius
      }
    })
  },
  
  nextLevel: () => {
    const state = get()
    set({ level: state.level + 1 })
    get().startGame()
  },
  
  // 智能移动到岔口或墙壁
  moveBall: (direction: 'up' | 'down' | 'left' | 'right') => {
    const state = get()
    console.log('moveBall调用:', { direction, isPlaying: state.isPlaying, isPaused: state.isPaused })
    
    if (!state.isPlaying || state.isPaused) {
      console.log('moveBall: 游戏未开始或已暂停')
      return
    }
    
    const { ball, maze, cellSize, mazeSize } = state
    
    if (!maze.length) {
      console.log('迷宫未生成')
      return
    }
    
    // 计算移动方向向量
    const directionVector = {
      up: { dx: 0, dy: -1 },
      down: { dx: 0, dy: 1 },
      left: { dx: -1, dy: 0 },
      right: { dx: 1, dy: 0 }
    }[direction]
    
    // 找到小球移动到岔口或墙壁的位置
    const newPosition = findMoveToIntersection(
      ball.x, 
      ball.y, 
      directionVector.dx, 
      directionVector.dy, 
      ball, 
      maze, 
      cellSize, 
      mazeSize
    )
    
    console.log('智能移动:', { 
      direction,
      oldPos: { x: ball.x, y: ball.y },
      newPos: newPosition
    })
    
    // 检查是否到达终点
    const endX = (mazeSize - 1) * cellSize + cellSize / 2
    const endY = (mazeSize - 1) * cellSize + cellSize / 2
    const distance = Math.sqrt((newPosition.x - endX) ** 2 + (newPosition.y - endY) ** 2)
    
    if (distance < ball.radius + 10) {
      set({ gameWon: true, isPlaying: false })
      console.log('🎉 到达终点！')
    }
    
    set({
      ball: {
        ...ball,
        x: newPosition.x,
        y: newPosition.y
      }
    })
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
  setLevel: (level: number) => set({ level }),
  
  setSensitivity: (sensitivity: number) => set({ sensitivity })
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

// 智能移动到岔口或墙壁的函数
function findMoveToIntersection(
  startX: number, 
  startY: number, 
  dx: number, 
  dy: number, 
  ball: Ball, 
  maze: MazeCell[][], 
  cellSize: number, 
  mazeSize: number
): { x: number, y: number } {
  let currentX = startX
  let currentY = startY
  const step = cellSize / 8 // 小步长移动以精确检测
  
  // 首先检查是否可以朝指定方向移动
  const nextX = currentX + dx * step
  const nextY = currentY + dy * step
  
  if (checkWallCollision(nextX, nextY, ball, maze, cellSize).x && dx !== 0) {
    console.log('水平方向被墙阻挡，无法移动')
    return { x: currentX, y: currentY }
  }
  
  if (checkWallCollision(nextX, nextY, ball, maze, cellSize).y && dy !== 0) {
    console.log('垂直方向被墙阻挡，无法移动')
    return { x: currentX, y: currentY }
  }
  
  // 开始移动直到遇到岔口或墙壁
  while (true) {
    const newX = currentX + dx * step
    const newY = currentY + dy * step
    
    // 边界检测
    const minX = ball.radius
    const maxX = mazeSize * cellSize - ball.radius
    const minY = ball.radius
    const maxY = mazeSize * cellSize - ball.radius
    
    if (newX < minX || newX > maxX || newY < minY || newY > maxY) {
      console.log('到达迷宫边界')
      break
    }
    
    // 墙壁碰撞检测
    const collision = checkWallCollision(newX, newY, ball, maze, cellSize)
    if ((collision.x && dx !== 0) || (collision.y && dy !== 0)) {
      console.log('遇到墙壁，停止移动')
      break
    }
    
    // 更新位置
    currentX = newX
    currentY = newY
    
    // 检查是否到达岔口（有其他可选路径）
    if (isAtIntersection(currentX, currentY, dx, dy, ball, maze, cellSize)) {
      console.log('到达岔口，停止移动')
      break
    }
  }
  
  return { x: currentX, y: currentY }
}

// 检查是否在岔口（除了来的方向和要去的方向，还有其他可选路径）
function isAtIntersection(
  x: number, 
  y: number, 
  moveX: number, 
  moveY: number, 
  ball: Ball, 
  maze: MazeCell[][], 
  cellSize: number
): boolean {
  const directions = [
    { dx: 0, dy: -1 }, // 上
    { dx: 1, dy: 0 },  // 右
    { dx: 0, dy: 1 },  // 下
    { dx: -1, dy: 0 }  // 左
  ]
  
  let availablePaths = 0
  
  for (const dir of directions) {
    // 跳过当前移动方向的反方向（来的方向）
    if (dir.dx === -moveX && dir.dy === -moveY) continue
    
    // 检查这个方向是否可以移动
    const testX = x + dir.dx * cellSize / 4
    const testY = y + dir.dy * cellSize / 4
    const collision = checkWallCollision(testX, testY, ball, maze, cellSize)
    
    if (!collision.x && !collision.y) {
      availablePaths++
    }
  }
  
  // 如果有2个或以上可选路径（包括当前移动方向），则认为是岔口
  return availablePaths >= 2
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
    return { x: true, y: true } // 超出边界视为碰撞
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