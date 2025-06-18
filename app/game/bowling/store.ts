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
  
  // 保龄球和球瓶（仅用于状态跟踪，实际物理由Three.js处理）
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
  processBallResult: (knockedDownPins?: number) => void
  
  // 手动检测陀螺仪支持（在客户端调用）
  detectGyroSupport: () => void
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
    z: -50,
    vx: 0,
    vy: 0,
    vz: 0,
    radius: 3,
    isRolling: false
  },
  
  // 球瓶初始状态（标准三角形排列）
  pins: [
    { id: 1, x: 0, y: 0, z: 50, isKnockedDown: false, angle: 0 },
    { id: 2, x: -2, y: 0, z: 56, isKnockedDown: false, angle: 0 },
    { id: 3, x: 2, y: 0, z: 56, isKnockedDown: false, angle: 0 },
    { id: 4, x: -4, y: 0, z: 62, isKnockedDown: false, angle: 0 },
    { id: 5, x: 0, y: 0, z: 62, isKnockedDown: false, angle: 0 },
    { id: 6, x: 4, y: 0, z: 62, isKnockedDown: false, angle: 0 },
    { id: 7, x: -6, y: 0, z: 68, isKnockedDown: false, angle: 0 },
    { id: 8, x: -2, y: 0, z: 68, isKnockedDown: false, angle: 0 },
    { id: 9, x: 2, y: 0, z: 68, isKnockedDown: false, angle: 0 },
    { id: 10, x: 6, y: 0, z: 68, isKnockedDown: false, angle: 0 }
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
    console.log('🎳 开始游戏')
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
    
    // 移除自动权限请求，改为通过对话框让用户主动请求
    console.log('🎮 游戏已启动，等待用户主动申请陀螺仪权限')
  },
  
  pauseGame: () => set({ isPaused: true }),
  resumeGame: () => set({ isPaused: false }),
  
  resetGame: () => {
    console.log('🔄 重置游戏')
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
      ballThrown: false,
      aimAngle: 0
    })
  },
  
  throwBall: () => {
    const state = get()
    if (!state.canThrow || state.ballThrown) return
    
    console.log('🎳 投球！', { aimAngle: state.aimAngle, power: state.power })
    
    set({
      canThrow: false,
      ballThrown: true
    })
  },
  
  nextFrame: () => {
    const state = get()
    if (state.currentFrame < 10) {
      console.log('➡️ 下一轮')
      set({
        currentFrame: state.currentFrame + 1,
        currentThrow: 1,
        canThrow: true,
        ballThrown: false,
        aimAngle: 0
      })
    }
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
    console.log('🔐 开始请求陀螺仪权限...')
    
    // 检测设备支持
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isAndroid = /Android/i.test(navigator.userAgent)
    const isMobile = isIOS || isAndroid
    const hasDeviceOrientation = 'DeviceOrientationEvent' in window
    
    console.log('📱 设备信息:', { isIOS, isAndroid, isMobile, hasDeviceOrientation })
    
    if (!hasDeviceOrientation) {
      console.log('❌ 设备不支持陀螺仪')
      set({ gyroSupported: false, gyroPermission: false })
      return
    }
    
    set({ gyroSupported: true })
    
    // iOS 设备需要显式请求权限
    if (isIOS && typeof DeviceOrientationEvent !== 'undefined' && 'requestPermission' in DeviceOrientationEvent) {
      try {
        console.log('📱 iOS设备，显示系统权限对话框')
        const permission = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission()
        console.log('🔐 iOS权限请求结果:', permission)
        
        const granted = permission === 'granted'
        set({ gyroPermission: granted })
        
        if (granted) {
          console.log('✅ iOS陀螺仪权限已获得')
        } else {
          console.log('❌ iOS陀螺仪权限被拒绝')
        }
      } catch (error) {
        console.error('❌ iOS权限请求失败:', error)
        set({ gyroPermission: false })
      }
    } 
    // Android 和其他移动设备
    else if (isMobile) {
      console.log('🤖 Android/移动设备，测试陀螺仪可用性')
      
      // 对于Android设备，我们需要测试陀螺仪是否真的可用
      let testPassed = false
      
      const testHandler = (event: DeviceOrientationEvent) => {
        if (event.alpha !== null || event.beta !== null || event.gamma !== null) {
          testPassed = true
          console.log('✅ 陀螺仪测试成功')
        }
      }
      
      window.addEventListener('deviceorientation', testHandler)
      
      // 等待100ms测试陀螺仪响应
      await new Promise(resolve => setTimeout(resolve, 100))
      
      window.removeEventListener('deviceorientation', testHandler)
      
      if (testPassed) {
        set({ gyroPermission: true })
        console.log('✅ Android陀螺仪权限已获得')
      } else {
        console.log('⚠️ Android陀螺仪可能需要用户手动开启')
        set({ gyroPermission: true }) // 假设有权限，让用户尝试
      }
    }
    // 桌面设备
    else {
      console.log('💻 桌面设备，陀螺仪不可用')
      set({ gyroPermission: false })
    }
  },
  
  // 设置
  setSensitivity: (value: number) => set({ sensitivity: value }),
  setAimAngle: (angle: number) => set({ aimAngle: angle }),
  setPower: (power: number) => set({ power }),
  
  // 辅助方法
  resetPins: () => {
    console.log('🎳 重置球瓶')
    // 重置球瓶状态
    set({
      pins: get().pins.map(pin => ({
        ...pin,
        isKnockedDown: false,
        angle: 0
      }))
    })
  },
  
  resetBall: () => {
    console.log('⚫ 重置球')
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
      },
      canThrow: true,
      ballThrown: false
    })
  },
  
  processBallResult: (knockedDownPins?: number) => {
    console.log('📊 处理投球结果开始')
    
    const state = get()
    console.log('🎯 当前状态:', { 
      canThrow: state.canThrow, 
      ballThrown: state.ballThrown,
      currentFrame: state.currentFrame 
    })
    
    // 使用传入的击倒数量，如果没有传入则使用随机数（向后兼容）
    const actualKnockedDown = knockedDownPins !== undefined ? knockedDownPins : Math.floor(Math.random() * 11)
    console.log('🎯 实际击倒球瓶数:', actualKnockedDown)
    
    const newScore = state.totalScore + actualKnockedDown
    
    // 立即重置投球状态
    set({
      totalScore: newScore,
      canThrow: true,
      ballThrown: false
    })
    
    console.log('✅ 状态已重置:', { 
      canThrow: true, 
      ballThrown: false,
      totalScore: newScore,
      knockedDownPins: actualKnockedDown
    })
    
    // 2秒后进入下一轮
    setTimeout(() => {
      console.log('➡️ 准备进入下一轮')
      get().nextFrame()
    }, 2000)
  },

  // 手动检测陀螺仪支持（在客户端调用）
  detectGyroSupport: () => {
    if (typeof window === 'undefined') return
    
    const hasDeviceOrientation = 'DeviceOrientationEvent' in window
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    
    console.log('🔍 检测陀螺仪支持:', { hasDeviceOrientation, isIOS })
    
    if (hasDeviceOrientation) {
      set({ gyroSupported: true })
      console.log('✅ 陀螺仪硬件支持')
      
      // 如果是iOS设备，需要用户手动触发权限请求
      if (!isIOS) {
        set({ gyroPermission: true })
        console.log('🤖 非iOS设备，默认有权限')
      }
    } else {
      console.log('❌ 设备不支持陀螺仪')
      set({ gyroSupported: false, gyroPermission: false })
    }
  }
})) 