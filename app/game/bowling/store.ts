import { create } from 'zustand'

export interface Ball {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  radius: number
  isRolling: boolean
}

export interface Pin {
  x: number
  y: number
  z: number
  isKnockedDown: boolean
  angle: number
  id: number
}

export interface GameState {
  // 游戏状态
  isPlaying: boolean
  isPaused: boolean
  gameStarted: boolean
  currentFrame: number
  currentThrow: number
  totalScore: number
  frameScores: number[]
  throwsInFrame: number[]
  
  // 保龄球和球瓶
  ball: Ball
  pins: Pin[]
  
  // 陀螺仪数据
  gyroSupported: boolean
  gyroPermission: boolean
  tiltX: number
  tiltY: number
  
  // 游戏控制
  aimAngle: number
  power: number
  canThrow: boolean
  ballThrown: boolean
  
  // 设置
  sensitivity: number
  
  // 游戏动作
  startGame: () => void
  pauseGame: () => void
  resumeGame: () => void
  resetGame: () => void
  throwBall: () => void
  nextFrame: () => void
  
  // 物理更新
  updatePhysics: (deltaTime: number) => void
  
  // 陀螺仪控制
  updateTilt: (x: number, y: number) => void
  requestGyroPermission: () => Promise<void>
  
  // 设置
  setSensitivity: (value: number) => void
  setAimAngle: (angle: number) => void
  setPower: (power: number) => void
  
  // 辅助方法
  resetPins: () => void
  resetBall: () => void
  checkCollisions: () => void
  processBallResult: () => void
}

export const useBowlingStore = create<GameState>((set, get) => ({
  // 初始状态
  isPlaying: false,
  isPaused: false,
  gameStarted: false,
  currentFrame: 1,
  currentThrow: 1,
  totalScore: 0,
  frameScores: Array(10).fill(0),
  throwsInFrame: Array(10).fill(0),
  
  // 保龄球初始状态
  ball: {
    x: 0,
    y: 0,
    z: -50, // 起始位置在后方
    vx: 0,
    vy: 0,
    vz: 0,
    radius: 3,
    isRolling: false
  },
  
  // 球瓶初始状态（10个球瓶，三角形排列）
  pins: [
    // 第一排
    { id: 1, x: 0, y: 0, z: 50, isKnockedDown: false, angle: 0 },
    // 第二排
    { id: 2, x: -3, y: 0, z: 55, isKnockedDown: false, angle: 0 },
    { id: 3, x: 3, y: 0, z: 55, isKnockedDown: false, angle: 0 },
    // 第三排
    { id: 4, x: -6, y: 0, z: 60, isKnockedDown: false, angle: 0 },
    { id: 5, x: 0, y: 0, z: 60, isKnockedDown: false, angle: 0 },
    { id: 6, x: 6, y: 0, z: 60, isKnockedDown: false, angle: 0 },
    // 第四排
    { id: 7, x: -9, y: 0, z: 65, isKnockedDown: false, angle: 0 },
    { id: 8, x: -3, y: 0, z: 65, isKnockedDown: false, angle: 0 },
    { id: 9, x: 3, y: 0, z: 65, isKnockedDown: false, angle: 0 },
    { id: 10, x: 9, y: 0, z: 65, isKnockedDown: false, angle: 0 }
  ],
  
  // 陀螺仪状态
  gyroSupported: false,
  gyroPermission: false,
  tiltX: 0,
  tiltY: 0,
  
  // 游戏控制
  aimAngle: 0,
  power: 50,
  canThrow: true,
  ballThrown: false,
  
  // 设置
  sensitivity: 0.5,
  
  // 游戏控制
  startGame: () => {
    set({
      isPlaying: true,
      isPaused: false,
      gameStarted: true,
      currentFrame: 1,
      currentThrow: 1,
      totalScore: 0,
      frameScores: Array(10).fill(0),
      throwsInFrame: Array(10).fill(0),
      canThrow: true,
      ballThrown: false
    })
    get().resetPins()
    get().resetBall()
  },
  
  pauseGame: () => set({ isPaused: true }),
  resumeGame: () => set({ isPaused: false }),
  
  resetGame: () => {
    set({
      isPlaying: false,
      isPaused: false,
      gameStarted: false,
      currentFrame: 1,
      currentThrow: 1,
      totalScore: 0,
      frameScores: Array(10).fill(0),
      throwsInFrame: Array(10).fill(0),
      canThrow: true,
      ballThrown: false
    })
    get().resetPins()
    get().resetBall()
  },
  
  throwBall: () => {
    const state = get()
    if (!state.canThrow || state.ballThrown) return
    
    console.log('🎳 投球！', { aimAngle: state.aimAngle, power: state.power })
    
    // 计算投球速度
    const angleRad = (state.aimAngle * Math.PI) / 180
    const speed = state.power / 10
    
    set({
      ball: {
        ...state.ball,
        vx: Math.sin(angleRad) * speed * 0.3,
        vy: 0,
        vz: speed,
        isRolling: true
      },
      canThrow: false,
      ballThrown: true
    })
    
    // 3秒后重置（模拟球滚动时间）
    setTimeout(() => {
      get().processBallResult()
    }, 3000)
  },
  
  nextFrame: () => {
    const state = get()
    if (state.currentFrame < 10) {
      set({
        currentFrame: state.currentFrame + 1,
        currentThrow: 1,
        canThrow: true,
        ballThrown: false
      })
      get().resetPins()
      get().resetBall()
    }
  },
  
  // 物理更新
  updatePhysics: (deltaTime: number) => {
    const state = get()
    if (!state.ball.isRolling) return
    
    // 更新球的位置
    const newBall = {
      ...state.ball,
      x: state.ball.x + state.ball.vx * deltaTime,
      y: state.ball.y + state.ball.vy * deltaTime,
      z: state.ball.z + state.ball.vz * deltaTime,
      vx: state.ball.vx * 0.98, // 摩擦力
      vz: state.ball.vz * 0.98
    }
    
    // 检查球是否停止
    if (Math.abs(newBall.vx) < 0.1 && Math.abs(newBall.vz) < 0.1) {
      newBall.isRolling = false
    }
    
    set({ ball: newBall })
    
    // 碰撞检测
    get().checkCollisions()
  },
  
  // 陀螺仪控制
  updateTilt: (x: number, y: number) => {
    const state = get()
    set({ tiltX: x, tiltY: y })
    
    if (state.canThrow && !state.ballThrown) {
      // 左右倾斜控制瞄准角度
      const newAngle = Math.max(-30, Math.min(30, x * state.sensitivity * 60))
      set({ aimAngle: newAngle })
    }
  },
  
  requestGyroPermission: async () => {
    console.log('🔐 自动请求陀螺仪权限...')
    
    if (typeof DeviceOrientationEvent !== 'undefined' && 'requestPermission' in DeviceOrientationEvent) {
      try {
        console.log('📱 iOS设备，请求权限')
        const permission = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission()
        console.log('🔐 权限请求结果:', permission)
        
        const granted = permission === 'granted'
        set({ 
          gyroPermission: granted,
          gyroSupported: true
        })
        
        if (granted) {
          console.log('✅ 陀螺仪权限已获得')
        } else {
          console.log('❌ 陀螺仪权限被拒绝')
        }
      } catch (error) {
        console.error('❌ 陀螺仪权限请求失败:', error)
        set({ gyroSupported: false, gyroPermission: false })
      }
    } else {
      console.log('✅ 非iOS设备，直接启用陀螺仪')
      set({ gyroSupported: true, gyroPermission: true })
    }
  },
  
  // 设置
  setSensitivity: (value: number) => set({ sensitivity: value }),
  setAimAngle: (angle: number) => set({ aimAngle: angle }),
  setPower: (power: number) => set({ power }),
  
  // 辅助方法
  resetPins: () => {
    set({
      pins: get().pins.map(pin => ({
        ...pin,
        isKnockedDown: false,
        angle: 0
      }))
    })
  },
  
  resetBall: () => {
    set({
      ball: {
        x: 0,
        y: 0,
        z: -50,
        vx: 0,
        vy: 0,
        vz: 0,
        radius: 3,
        isRolling: false
      }
    })
  },
  
  checkCollisions: () => {
    const state = get()
    const { ball, pins } = state
    
    pins.forEach(pin => {
      if (pin.isKnockedDown) return
      
      const distance = Math.sqrt(
        (ball.x - pin.x) ** 2 + 
        (ball.z - pin.z) ** 2
      )
      
      if (distance < ball.radius + 2) { // 2是球瓶半径
        console.log(`💥 击倒球瓶 ${pin.id}`)
        pin.isKnockedDown = true
        pin.angle = Math.random() * 360
      }
    })
    
    set({ pins: [...pins] })
  },
  
  processBallResult: () => {
    const state = get()
    const knockedPins = state.pins.filter(pin => pin.isKnockedDown).length
    
    console.log(`🎯 击倒 ${knockedPins} 个球瓶`)
    
    // 计算得分
    const newFrameScores = [...state.frameScores]
    const newThrowsInFrame = [...state.throwsInFrame]
    
    newFrameScores[state.currentFrame - 1] += knockedPins
    newThrowsInFrame[state.currentFrame - 1] = state.currentThrow
    
    const totalScore = newFrameScores.reduce((sum, score) => sum + score, 0)
    
    if (state.currentThrow === 1 && knockedPins === 10) {
      // Strike
      console.log('🎯 STRIKE!')
      get().nextFrame()
    } else if (state.currentThrow === 2 || knockedPins === 10) {
      // 第二次投球或全倒
      if (knockedPins === 10) {
        console.log('🎯 SPARE!')
      }
      get().nextFrame()
    } else {
      // 第一次投球，准备第二次
      set({
        currentThrow: 2,
        canThrow: true,
        ballThrown: false
      })
      get().resetBall()
    }
    
    set({
      totalScore,
      frameScores: newFrameScores,
      throwsInFrame: newThrowsInFrame
    })
  }
}))

// 自动检测陀螺仪支持
if (typeof window !== 'undefined') {
  const detectGyroSupport = async () => {
    console.log('🔍 自动检测陀螺仪支持...')
    
    if (!('DeviceOrientationEvent' in window)) {
      console.log('❌ 设备不支持 DeviceOrientationEvent')
      useBowlingStore.setState({ gyroSupported: false })
      return
    }

    console.log('✅ DeviceOrientationEvent 存在')

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    
    console.log('📱 设备检测:', { 
      isIOS, 
      userAgent: navigator.userAgent,
      platform: navigator.platform
    })

    useBowlingStore.setState({ gyroSupported: true })

    if (isIOS && 'requestPermission' in DeviceOrientationEvent) {
      console.log('🍎 iOS设备，将自动请求权限')
      // 等待一秒后自动请求权限
      setTimeout(() => {
        useBowlingStore.getState().requestGyroPermission()
      }, 1000)
    } else {
      console.log('✅ 非iOS设备，直接启用陀螺仪')
      useBowlingStore.setState({ gyroPermission: true })
    }
  }

  detectGyroSupport()
} 