import { create } from 'zustand'
import * as THREE from 'three'

export interface MazeCell {
  top: boolean
  right: boolean
  bottom: boolean
  left: boolean
  visited?: boolean
}

export interface Ball {
  x: number
  y: number
  z: number
  mesh?: THREE.Mesh
}

export interface Camera {
  position: THREE.Vector3
  target: THREE.Vector3
  mode: 'follow' | 'top' | 'first-person'
}

export interface MazeStore {
  // 游戏状态
  gameStarted: boolean
  gameCompleted: boolean
  gameTime: number
  moves: number
  
  // 迷宫设置
  mazeSize: number
  cellSize: number
  wallHeight: number
  maze: MazeCell[][]
  
  // 小球
  ball: Ball
  ballSpeed: number
  isMoving: boolean
  lastMoveDirection?: 'up' | 'down' | 'left' | 'right' // 添加最后移动方向跟踪
  
  // 自动寻路
  autoPath: { x: number, y: number }[]
  isAutoMoving: boolean
  
  // Three.js 相关
  scene?: THREE.Scene
  camera?: THREE.PerspectiveCamera
  renderer?: THREE.WebGLRenderer
  directionalLight?: THREE.DirectionalLight
  ambientLight?: THREE.AmbientLight
  
  // 摄像机控制
  cameraConfig: Camera
  
  // 动作
  startGame: () => void
  resetGame: () => void
  generateMaze: () => void
  moveBall: (direction: 'up' | 'down' | 'left' | 'right') => void
  moveToPosition: (targetX: number, targetY: number) => void
  initThreeJS: (canvas: HTMLCanvasElement) => void
  updateCamera: () => void
  setCameraMode: (mode: 'follow' | 'top' | 'first-person') => void
  animate: () => void
  cleanup: () => void
}

export const useMazeStore = create<MazeStore>((set, get) => ({
  // 初始状态
  gameStarted: false,
  gameCompleted: false,
  gameTime: 0,
  moves: 0,
  
  mazeSize: 15,
  cellSize: 2,
  wallHeight: 1,
  maze: [],
  
  ball: { x: 1, y: 0.5, z: 1 }, // 将在initThreeJS中更新为正确的位置
  ballSpeed: 0.1,
  isMoving: false,
  lastMoveDirection: 'right', // 默认朝右看
  
  autoPath: [],
  isAutoMoving: false,
  
  cameraConfig: {
    position: new THREE.Vector3(0, 20, 20),
    target: new THREE.Vector3(0, 0, 0),
    mode: 'follow'
  },
  
  startGame: () => {
    console.log('🎮 startGame 被调用')
    const state = get()
    console.log('当前游戏状态:', { gameStarted: state.gameStarted })
    
    if (!state.gameStarted) {
      console.log('✅ 开始游戏')
      set({ 
        gameStarted: true, 
        gameTime: 0,
        moves: 0,
        gameCompleted: false 
      })
      
      // 开始计时
      const startTime = Date.now()
      const timer = setInterval(() => {
        const current = get()
        if (current.gameStarted && !current.gameCompleted) {
          set({ gameTime: Math.floor((Date.now() - startTime) / 1000) })
        } else {
          clearInterval(timer)
        }
      }, 1000)
      
      console.log('🎮 游戏已开始，计时器已启动')
    } else {
      console.log('⚠️ 游戏已经开始了')
    }
  },
  
  resetGame: () => {
    const state = get()
    
    // 重置小球位置
    const newBall = { x: 1, y: 0.5, z: 1 }
    if (state.ball.mesh) {
      state.ball.mesh.position.set(newBall.x, newBall.y, newBall.z)
    }
    
    set({
      gameStarted: false,
      gameCompleted: false,
      gameTime: 0,
      moves: 0,
      ball: newBall,
      isMoving: false,
      lastMoveDirection: 'right', // 重置默认方向
      autoPath: [],
      isAutoMoving: false
    })
    
    // 重新生成迷宫
    get().generateMaze()
  },
  
  generateMaze: () => {
    const { mazeSize } = get()
    console.log('🏗️ 生成迷宫开始, 大小:', mazeSize)
    const maze: MazeCell[][] = []
    
    // 初始化迷宫网格
    for (let y = 0; y < mazeSize; y++) {
      maze[y] = []
      for (let x = 0; x < mazeSize; x++) {
        maze[y][x] = {
          top: true,
          right: true,
          bottom: true,
          left: true,
          visited: false
        }
      }
    }
    
    // 使用递归回溯算法生成迷宫
    const stack: Array<{x: number, y: number}> = []
    const startX = 0
    const startY = 0
    
    maze[startY][startX].visited = true
    stack.push({ x: startX, y: startY })
    
    while (stack.length > 0) {
      const current = stack[stack.length - 1]
      const neighbors = getUnvisitedNeighbors(current.x, current.y, maze, mazeSize)
      
      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)]
        
        // 移除墙壁
        if (next.x === current.x + 1) {
          maze[current.y][current.x].right = false
          maze[next.y][next.x].left = false
        } else if (next.x === current.x - 1) {
          maze[current.y][current.x].left = false
          maze[next.y][next.x].right = false
        } else if (next.y === current.y + 1) {
          maze[current.y][current.x].bottom = false
          maze[next.y][next.x].top = false
        } else if (next.y === current.y - 1) {
          maze[current.y][current.x].top = false
          maze[next.y][next.x].bottom = false
        }
        
        maze[next.y][next.x].visited = true
        stack.push(next)
      } else {
        stack.pop()
      }
    }
    
    set({ maze })
    console.log('✅ 迷宫生成完成, 迷宫大小:', maze.length, 'x', maze[0]?.length)
    console.log('🚪 起点墙壁状态:', maze[0]?.[0])
    
    // 更新3D场景（延迟执行以避免循环更新）
    setTimeout(() => {
      const state = get()
      if (state.scene) {
        console.log('🎨 更新3D迷宫场景')
        updateMazeScene(state.scene, maze, state.mazeSize, state.cellSize, state.wallHeight)
      }
    }, 0)
  },
  
  moveBall: (direction: 'up' | 'down' | 'left' | 'right') => {
    const state = get()
    
    console.log('🎯 moveBall 调用:', {
      direction,
      isMoving: state.isMoving,
      gameCompleted: state.gameCompleted,
      ballPosition: { x: state.ball.x, z: state.ball.z },
      mazeLength: state.maze.length
    })
    
    if (state.isMoving || state.gameCompleted) {
      console.log('❌ 移动被阻止:', { isMoving: state.isMoving, gameCompleted: state.gameCompleted })
      return
    }
    
    if (state.maze.length === 0) {
      console.log('❌ 迷宫未生成')
      return
    }

    const { ball, maze, mazeSize, cellSize } = state
    
    // 转换为网格坐标
    const gridX = Math.round((ball.x - cellSize / 2) / cellSize)
    const gridY = Math.round((ball.z - cellSize / 2) / cellSize)
    
    console.log('📍 当前网格位置:', { gridX, gridY, ballX: ball.x, ballZ: ball.z, cellSize })
    
    // 智能移动：找到下一个岔口或墙壁
    const targetPosition = findNextIntersectionOrWall(gridX, gridY, direction, maze, mazeSize)
    
    if (!targetPosition) {
      console.log('❌ 无法向该方向移动')
      return
    }
    
    console.log('🎯 目标位置:', targetPosition)
    
    set({ isMoving: true, moves: state.moves + 1 })
    
    const newX = targetPosition.x * cellSize + cellSize / 2
    const newZ = targetPosition.y * cellSize + cellSize / 2
    
    console.log('✅ 开始移动动画:', { from: { x: ball.x, z: ball.z }, to: { x: newX, z: newZ } })
    
    // 动画移动小球
    animateBallMovement(ball, { x: newX, y: ball.y, z: newZ }, () => {
      const currentState = get()
      set({ 
        ball: { ...currentState.ball, x: newX, z: newZ },
        isMoving: false,
        lastMoveDirection: direction // 记录最后移动方向
      })
      
      console.log('🎯 移动完成:', { newX, newZ, direction })
      
      // 检查是否到达终点
      if (targetPosition.x === mazeSize - 1 && targetPosition.y === mazeSize - 1) {
        console.log('🎉 到达终点!')
        set({ gameCompleted: true })
      }
      
      // 更新摄像机
      get().updateCamera()
    })
  },
  
  moveToPosition: (targetX: number, targetY: number) => {
    const state = get()
    if (state.maze.length === 0) {
      console.log('❌ 迷宫未生成')
      return
    }

    const { ball, maze, mazeSize, cellSize } = state
    
    // 转换为网格坐标 - 更精确的计算
    const gridX = Math.round((ball.x - cellSize / 2) / cellSize)
    const gridY = Math.round((ball.z - cellSize / 2) / cellSize)
    
    // 确保起始坐标在有效范围内
    const startX = Math.max(0, Math.min(mazeSize - 1, gridX))
    const startY = Math.max(0, Math.min(mazeSize - 1, gridY))
    
    // 确保目标坐标在有效范围内
    const endX = Math.max(0, Math.min(mazeSize - 1, targetX))
    const endY = Math.max(0, Math.min(mazeSize - 1, targetY))
    
    console.log('📍 寻路信息:', { 
      ball: { x: ball.x, z: ball.z },
      start: { x: startX, y: startY }, 
      target: { x: endX, y: endY },
      mazeSize,
      cellSize,
      isTargetEndpoint: endX === mazeSize - 1 && endY === mazeSize - 1
    })
    
    // 如果目标就是当前位置，不需要移动
    if (startX === endX && startY === endY) {
      console.log('🎯 已在目标位置')
      return
    }
    
    // 自动寻路
    const path = findPath(startX, startY, endX, endY, maze, mazeSize)
    
    if (path.length > 0) {
      console.log('🚗 自动寻路成功，路径长度:', path.length, '路径:', path)
      console.log('🎯 路径最后一个点:', path[path.length - 1])
      console.log('🏁 目标终点:', { x: endX, y: endY })
      
      // 检查目标是否是终点
      const isTargetEndpoint = endX === mazeSize - 1 && endY === mazeSize - 1
      console.log('🎯 点击的是终点吗?', isTargetEndpoint)
      
      set({ autoPath: path, isAutoMoving: true })
      
      // 开始自动移动
      autoMove(ball, path, () => {
        console.log('🎉 到达目标位置!')
        set({ isAutoMoving: false })
        
        // 如果目标是终点，确保游戏完成
        if (isTargetEndpoint) {
          console.log('🏆 确认到达终点，游戏完成!')
          set({ gameCompleted: true })
        }
      })
    } else {
      console.log('❌ 无法找到路径到:', { x: endX, y: endY })
    }
  },
  
  initThreeJS: (canvas: HTMLCanvasElement) => {
    const state = get()
    
    // 如果已经初始化，直接返回
    if (state.scene && state.camera && state.renderer) {
      console.log('Three.js 已经初始化，跳过重复初始化')
      return
    }
    
    console.log('🚀 开始初始化 Three.js')
    
    const { mazeSize, cellSize } = state
    
    // 创建场景
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x87CEEB) // 天蓝色背景
    
    // 创建摄像机
    const camera = new THREE.PerspectiveCamera(
      75,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    )
    
    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ 
      canvas,
      antialias: true 
    })
    renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    
    // 创建光源
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(mazeSize, mazeSize * 2, mazeSize)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)
    
    // 创建地板
    const floorGeometry = new THREE.PlaneGeometry(mazeSize * cellSize, mazeSize * cellSize)
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.position.set(mazeSize * cellSize / 2, 0, mazeSize * cellSize / 2)
    floor.receiveShadow = true
    scene.add(floor)
    
    // 创建小球（增大尺寸）
    const ballGeometry = new THREE.SphereGeometry(0.5, 32, 32)
    const ballMaterial = new THREE.MeshLambertMaterial({ color: 0xff4444 })
    const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial)
    
    // 小球初始位置：第一个格子的中心
    const initialX = cellSize / 2
    const initialZ = cellSize / 2
    ballMesh.position.set(initialX, 0.5, initialZ)
    ballMesh.castShadow = true
    scene.add(ballMesh)
    
    console.log('⚽ 小球初始位置:', { x: initialX, y: 0.5, z: initialZ })
    
    // 更新状态
    set({
      scene,
      camera,
      renderer,
      directionalLight,
      ambientLight,
      ball: { x: initialX, y: 0.5, z: initialZ, mesh: ballMesh }
    })
    
    console.log('✅ Three.js 初始化完成')
    
    // 延迟执行其他初始化操作，避免立即触发更新
    setTimeout(() => {
      const currentState = get()
      
      console.log('🏗️ 开始生成迷宫')
      // 生成迷宫
      currentState.generateMaze()
      
      // 设置初始摄像机位置
      currentState.updateCamera()
      
      // 开始动画循环
      currentState.animate()
      
      // 自动开始游戏
      currentState.startGame()
      
      console.log('🎮 游戏初始化完成')
    }, 0)
  },
  
  updateCamera: () => {
    const state = get()
    if (!state.camera) return
    
    const { ball, cameraConfig, mazeSize, cellSize, lastMoveDirection } = state
    
    switch (cameraConfig.mode) {
      case 'follow':
        // 2.5D视角：确保整个迷宫都能完整显示
        const viewHeight = mazeSize * cellSize * 0.8 // 适当提高高度，确保能看到全部迷宫
        const centerX = mazeSize * cellSize / 2
        const centerZ = mazeSize * cellSize / 2
        
        state.camera.position.set(
          centerX,
          viewHeight,
          centerZ - mazeSize * cellSize * 0.2 // 向后退一些，确保完整显示
        )
        state.camera.lookAt(centerX, 0, centerZ)
        
        // 调整视野角度，平衡显示大小和完整性
        state.camera.fov = 60 // 适中的视野角度，既能看全又不会太小
        state.camera.updateProjectionMatrix()
        
        console.log('📷 2.5D视角设置:', {
          position: { x: centerX, y: viewHeight, z: centerZ - mazeSize * cellSize * 0.05 },
          lookAt: { x: centerX, y: 0, z: centerZ },
          fov: 50,
          mazeSize: mazeSize * cellSize
        })
        break
        
      case 'top':
        state.camera.position.set(
          mazeSize * cellSize / 2,
          mazeSize * cellSize,
          mazeSize * cellSize / 2
        )
        state.camera.lookAt(mazeSize * cellSize / 2, 0, mazeSize * cellSize / 2)
        break
        
      case 'first-person':
        // 第一人称视角：摄像机位置接近地面，模拟人眼高度
        const cameraHeight = ball.y + 0.2 // 更低的摄像机高度，更贴近地面
        state.camera.position.set(ball.x, cameraHeight, ball.z)
        
        // 根据最后移动方向确定视角朝向
        let lookAtX = ball.x
        let lookAtZ = ball.z
        const lookAtY = cameraHeight // 保持水平视线
        
        if (lastMoveDirection) {
          const lookDistance = 2 // 减少视线距离，更自然
          switch (lastMoveDirection) {
            case 'up':
              lookAtZ = ball.z - lookDistance
              break
            case 'down':
              lookAtZ = ball.z + lookDistance
              break
            case 'left':
              lookAtX = ball.x - lookDistance
              break
            case 'right':
              lookAtX = ball.x + lookDistance
              break
          }
        } else {
          // 如果没有移动方向，默认向右看
          lookAtX = ball.x + 2
        }
        
        state.camera.lookAt(lookAtX, lookAtY, lookAtZ)
        console.log('👁️ 第一人称视角更新:', { 
          cameraPos: { x: ball.x, y: cameraHeight, z: ball.z },
          lookAt: { x: lookAtX, y: lookAtY, z: lookAtZ },
          direction: lastMoveDirection 
        })
        break
    }
  },
  
  setCameraMode: (mode: 'follow' | 'top' | 'first-person') => {
    set(state => ({
      cameraConfig: { ...state.cameraConfig, mode }
    }))
    get().updateCamera()
  },
  
  animate: () => {
    const state = get()
    if (!state.renderer || !state.scene || !state.camera) return
    
    const animate = () => {
      requestAnimationFrame(animate)
      state.renderer!.render(state.scene!, state.camera!)
    }
    animate()
  },
  
  cleanup: () => {
    const state = get()
    if (state.renderer) {
      state.renderer.dispose()
    }
    if (state.scene) {
      state.scene.clear()
    }
  },
  

}))

// 辅助函数
function getUnvisitedNeighbors(x: number, y: number, maze: MazeCell[][], size: number) {
  const neighbors = []
  
  if (x > 0 && !maze[y][x - 1].visited) {
    neighbors.push({ x: x - 1, y })
  }
  if (x < size - 1 && !maze[y][x + 1].visited) {
    neighbors.push({ x: x + 1, y })
  }
  if (y > 0 && !maze[y - 1][x].visited) {
    neighbors.push({ x, y: y - 1 })
  }
  if (y < size - 1 && !maze[y + 1][x].visited) {
    neighbors.push({ x, y: y + 1 })
  }
  
  return neighbors
}

function updateMazeScene(
  scene: THREE.Scene, 
  maze: MazeCell[][], 
  mazeSize: number, 
  cellSize: number, 
  wallHeight: number
) {
  // 移除现有的墙壁和终点
  const objectsToRemove = scene.children.filter(child => 
    child.userData.type === 'wall' || child.userData.type === 'goal'
  )
  objectsToRemove.forEach(obj => scene.remove(obj))
  
  // 创建墙壁几何体和材质
  const wallGeometry = new THREE.BoxGeometry(cellSize, wallHeight, 0.1)
  const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 })
  
  // 生成墙壁
  for (let y = 0; y < mazeSize; y++) {
    for (let x = 0; x < mazeSize; x++) {
      const cell = maze[y][x]
      const centerX = x * cellSize + cellSize / 2
      const centerZ = y * cellSize + cellSize / 2
      
      // 顶部墙壁
      if (cell.top) {
        const wall = new THREE.Mesh(wallGeometry, wallMaterial)
        wall.position.set(centerX, wallHeight / 2, centerZ - cellSize / 2)
        wall.castShadow = true
        wall.userData.type = 'wall'
        scene.add(wall)
      }
      
      // 右侧墙壁
      if (cell.right) {
        const wall = new THREE.Mesh(wallGeometry, wallMaterial)
        wall.rotation.y = Math.PI / 2
        wall.position.set(centerX + cellSize / 2, wallHeight / 2, centerZ)
        wall.castShadow = true
        wall.userData.type = 'wall'
        scene.add(wall)
      }
      
      // 底部墙壁
      if (cell.bottom) {
        const wall = new THREE.Mesh(wallGeometry, wallMaterial)
        wall.position.set(centerX, wallHeight / 2, centerZ + cellSize / 2)
        wall.castShadow = true
        wall.userData.type = 'wall'
        scene.add(wall)
      }
      
      // 左侧墙壁
      if (cell.left) {
        const wall = new THREE.Mesh(wallGeometry, wallMaterial)
        wall.rotation.y = Math.PI / 2
        wall.position.set(centerX - cellSize / 2, wallHeight / 2, centerZ)
        wall.castShadow = true
        wall.userData.type = 'wall'
        scene.add(wall)
      }
    }
  }
  
  // 添加终点标记（绿色出口标志）
  const goalGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.15, 16)
  const goalMaterial = new THREE.MeshLambertMaterial({ color: 0x00FF00 }) // 绿色
  const goal = new THREE.Mesh(goalGeometry, goalMaterial)
  goal.position.set(
    (mazeSize - 1) * cellSize + cellSize / 2,
    0.08,
    (mazeSize - 1) * cellSize + cellSize / 2
  )
  goal.userData.type = 'goal'
  scene.add(goal)
}

function animateBallMovement(
  ball: Ball,
  target: { x: number, y: number, z: number },
  onComplete: () => void
) {
  if (!ball.mesh) return
  
  const startPos = ball.mesh.position.clone()
  const targetPos = new THREE.Vector3(target.x, target.y, target.z)
  const duration = 50 // 毫秒，减少动画时间
  const startTime = Date.now()
  
  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // 使用缓动函数
    const easeProgress = 1 - Math.pow(1 - progress, 3)
    
    if (ball.mesh) {
      ball.mesh.position.lerpVectors(startPos, targetPos, easeProgress)
      
      // 添加跳跃效果
      ball.mesh.position.y = target.y + Math.sin(progress * Math.PI) * 0.3
    }
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      if (ball.mesh) {
        ball.mesh.position.copy(targetPos)
      }
      onComplete()
    }
  }
  
  animate()
}

function findNextIntersectionOrWall(
  startX: number,
  startY: number,
  direction: 'up' | 'down' | 'left' | 'right',
  maze: MazeCell[][],
  mazeSize: number
): { x: number, y: number } | null {
  console.log('🔍 开始智能移动搜索:', { startX, startY, direction })
  
  let currentX = startX
  let currentY = startY
  
  // 首先检查是否可以向指定方向移动
  if (!canMoveInDirection(currentX, currentY, direction, maze, mazeSize)) {
    console.log('❌ 初始方向被墙壁阻挡')
    return null
  }
  
  // 向指定方向移动一步
  const { x: nextX, y: nextY } = getNextPosition(currentX, currentY, direction)
  currentX = nextX
  currentY = nextY
  
  console.log('📍 移动到:', { currentX, currentY })
  
  // 继续移动直到遇到岔口或死路
  while (true) {
    // 检查当前位置是否是岔口（有多个可选方向）
    const availableDirections = getAvailableDirections(currentX, currentY, maze, mazeSize)
    console.log('🚪 可用方向:', availableDirections)
    
    // 如果是岔口（有多个方向可选），停在这里
    if (availableDirections.length > 2) {
      console.log('🔄 到达岔口，停止移动')
      break
    }
    
    // 如果是死路（只有一个方向，就是来的方向），停在这里
    if (availableDirections.length <= 1) {
      console.log('🚫 到达死路，停止移动')
      break
    }
    
    // 如果只有两个方向（直线通道），继续向前移动
    if (availableDirections.length === 2) {
      // 找到不是来的方向的那个方向
      const oppositeDirection = getOppositeDirection(direction)
      const nextDirection = availableDirections.find(dir => dir !== oppositeDirection)
      
      if (!nextDirection) {
        console.log('🚫 无法确定前进方向，停止移动')
        break
      }
      
      // 如果前进方向与当前方向不同，说明需要转弯，停在这里
      if (nextDirection !== direction) {
        console.log('↩️ 需要转弯，停止移动')
        break
      }
      
      // 继续向前移动
      const nextPos = getNextPosition(currentX, currentY, direction)
      if (!canMoveInDirection(currentX, currentY, direction, maze, mazeSize)) {
        console.log('🚫 前方被墙壁阻挡，停止移动')
        break
      }
      
      currentX = nextPos.x
      currentY = nextPos.y
      console.log('➡️ 继续前进到:', { currentX, currentY })
    }
  }
  
  console.log('✅ 智能移动结束，目标位置:', { x: currentX, y: currentY })
  return { x: currentX, y: currentY }
}

function canMoveInDirection(
  x: number,
  y: number,
  direction: 'up' | 'down' | 'left' | 'right',
  maze: MazeCell[][],
  mazeSize: number
): boolean {
  switch (direction) {
    case 'up':
      return y > 0 && !maze[y][x].top
    case 'down':
      return y < mazeSize - 1 && !maze[y][x].bottom
    case 'left':
      return x > 0 && !maze[y][x].left
    case 'right':
      return x < mazeSize - 1 && !maze[y][x].right
    default:
      return false
  }
}

function getNextPosition(
  x: number,
  y: number,
  direction: 'up' | 'down' | 'left' | 'right'
): { x: number, y: number } {
  switch (direction) {
    case 'up':
      return { x, y: y - 1 }
    case 'down':
      return { x, y: y + 1 }
    case 'left':
      return { x: x - 1, y }
    case 'right':
      return { x: x + 1, y }
    default:
      return { x, y }
  }
}

function getAvailableDirections(
  x: number,
  y: number,
  maze: MazeCell[][],
  mazeSize: number
): ('up' | 'down' | 'left' | 'right')[] {
  const directions: ('up' | 'down' | 'left' | 'right')[] = []
  
  if (canMoveInDirection(x, y, 'up', maze, mazeSize)) {
    directions.push('up')
  }
  if (canMoveInDirection(x, y, 'down', maze, mazeSize)) {
    directions.push('down')
  }
  if (canMoveInDirection(x, y, 'left', maze, mazeSize)) {
    directions.push('left')
  }
  if (canMoveInDirection(x, y, 'right', maze, mazeSize)) {
    directions.push('right')
  }
  
  return directions
}

function getOppositeDirection(direction: 'up' | 'down' | 'left' | 'right'): 'up' | 'down' | 'left' | 'right' {
  switch (direction) {
    case 'up': return 'down'
    case 'down': return 'up'
    case 'left': return 'right'
    case 'right': return 'left'
  }
}

// A* 寻路算法
function findPath(
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  maze: MazeCell[][],
  mazeSize: number
): { x: number, y: number }[] {
  // 如果目标位置超出边界，返回空路径
  if (targetX < 0 || targetX >= mazeSize || targetY < 0 || targetY >= mazeSize) {
    return []
  }
  
  // 如果起点和终点相同，返回空路径
  if (startX === targetX && startY === targetY) {
    return []
  }
  
  interface Node {
    x: number
    y: number
    g: number // 从起点到当前点的实际距离
    h: number // 从当前点到终点的预估距离
    f: number // g + h
    parent?: Node
  }
  
  const openSet: Node[] = []
  const closedSet: Set<string> = new Set()
  
  // 启发式函数：曼哈顿距离
  const heuristic = (x: number, y: number) => {
    return Math.abs(x - targetX) + Math.abs(y - targetY)
  }
  
  // 起始节点
  const startNode: Node = {
    x: startX,
    y: startY,
    g: 0,
    h: heuristic(startX, startY),
    f: 0
  }
  startNode.f = startNode.g + startNode.h
  openSet.push(startNode)
  
  while (openSet.length > 0) {
    // 找到f值最小的节点
    let currentIndex = 0
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[currentIndex].f) {
        currentIndex = i
      }
    }
    
    const current = openSet.splice(currentIndex, 1)[0]
    const currentKey = `${current.x},${current.y}`
    closedSet.add(currentKey)
    
    // 如果到达目标
    if (current.x === targetX && current.y === targetY) {
      const path: { x: number, y: number }[] = []
      let node: Node | undefined = current
      while (node) {
        path.unshift({ x: node.x, y: node.y })
        node = node.parent
      }
      return path.slice(1) // 移除起点
    }
    
    // 检查四个方向的邻居
    const directions: Array<{ dx: number, dy: number, dir: 'up' | 'down' | 'left' | 'right' }> = [
      { dx: 0, dy: -1, dir: 'up' },
      { dx: 0, dy: 1, dir: 'down' },
      { dx: -1, dy: 0, dir: 'left' },
      { dx: 1, dy: 0, dir: 'right' }
    ]
    
    for (const { dx, dy, dir } of directions) {
      const newX = current.x + dx
      const newY = current.y + dy
      const neighborKey = `${newX},${newY}`
      
      // 检查边界
      if (newX < 0 || newX >= mazeSize || newY < 0 || newY >= mazeSize) {
        continue
      }
      
      // 检查是否已经在关闭列表中
      if (closedSet.has(neighborKey)) {
        continue
      }
      
      // 检查是否可以移动到这个位置
      if (!canMoveInDirection(current.x, current.y, dir, maze, mazeSize)) {
        continue
      }
      
      const g = current.g + 1
      const h = heuristic(newX, newY)
      const f = g + h
      
      // 检查是否已经在开放列表中
      const existingIndex = openSet.findIndex(node => node.x === newX && node.y === newY)
      if (existingIndex !== -1) {
        // 如果新路径更短，更新节点
        if (g < openSet[existingIndex].g) {
          openSet[existingIndex].g = g
          openSet[existingIndex].f = f
          openSet[existingIndex].parent = current
        }
      } else {
        // 添加新节点到开放列表
        openSet.push({
          x: newX,
          y: newY,
          g,
          h,
          f,
          parent: current
        })
      }
    }
  }
  
  return [] // 无法找到路径
}

// 自动移动函数
function autoMove(
  ball: Ball,
  path: { x: number, y: number }[],
  onComplete: () => void
) {
  if (path.length === 0) {
    onComplete()
    return
  }
  
  let currentIndex = 0
  const cellSize = 2 // 从store中获取
  
  const moveToNext = () => {
    if (currentIndex >= path.length) {
      // 路径完成，检查是否到达终点
      const state = useMazeStore.getState()
      const finalGridX = Math.round((ball.x - cellSize / 2) / cellSize)
      const finalGridY = Math.round((ball.z - cellSize / 2) / cellSize)
      
      console.log('🏁 路径完成检查:', {
        finalPos: { x: finalGridX, y: finalGridY },
        endpoint: { x: state.mazeSize - 1, y: state.mazeSize - 1 },
        isEndpoint: finalGridX === state.mazeSize - 1 && finalGridY === state.mazeSize - 1
      })
      
      if (finalGridX === state.mazeSize - 1 && finalGridY === state.mazeSize - 1) {
        console.log('🎉 路径完成时到达终点!')
        useMazeStore.setState({ gameCompleted: true, isAutoMoving: false })
      }
      
      onComplete()
      return
    }
    
    const target = path[currentIndex]
    const targetX = target.x * cellSize + cellSize / 2
    const targetZ = target.y * cellSize + cellSize / 2
    
    // 使用现有的动画函数
    animateBallMovement(
      ball,
      { x: targetX, y: 0.5, z: targetZ },
      () => {
        // 更新小球状态位置
        const state = useMazeStore.getState()
        useMazeStore.setState({
          ball: { ...state.ball, x: targetX, y: 0.5, z: targetZ },
          moves: state.moves + 1
        })
        
        // 检查是否到达终点（每一步都检查）
        const gridX = Math.round((targetX - cellSize / 2) / cellSize)
        const gridY = Math.round((targetZ - cellSize / 2) / cellSize)
        const isAtEndpoint = gridX === state.mazeSize - 1 && gridY === state.mazeSize - 1
        
        console.log('🔍 检查终点:', {
          worldPos: { x: targetX, z: targetZ },
          gridPos: { x: gridX, y: gridY },
          endpoint: { x: state.mazeSize - 1, y: state.mazeSize - 1 },
          isEndpoint: isAtEndpoint,
          currentIndex,
          totalPath: path.length
        })
        
        if (isAtEndpoint) {
          console.log('🎉 到达终点，游戏完成!')
          useMazeStore.setState({ gameCompleted: true, isAutoMoving: false })
          return // 立即停止，不再继续移动
        }
        
        currentIndex++
        // 减少延迟，提高移动速度
        setTimeout(moveToNext, 0)
      }
    )
  }
  
  moveToNext()
} 