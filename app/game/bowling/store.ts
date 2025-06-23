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
  pinsStanding: number // 新增：追踪当前轮次站立的球瓶数
  
  // 分数
  totalScore: number
  frameScores: number[]
  throwsInFrame: number[]
  
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
  
  // 结果显示
  lastKnockedDown: number
  showingResult: boolean
  
  // 游戏动作
  startGame: () => void
  resetGame: () => void
  throwBall: () => void
  processThrowResult: (knockedDownCount: number) => void

  // 陀螺仪控制
  requestGyroPermission: () => Promise<void>
  updateTilt: (x: number, y: number) => void
  
  // 设置
  setAimAngle: (angle: number) => void
  setPower: (power: number) => void
  
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
  pinsStanding: 10,
  totalScore: 0,
  frameScores: Array(5).fill(0),
  throwsInFrame: Array(5).fill(0),
  
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
  
  // 结果显示
  lastKnockedDown: 0,
  showingResult: false,
  
  // 游戏控制
  startGame: () => {
    console.log('🎳 开始游戏')
    get().resetGame();
    set({
      isPlaying: true,
      gameStarted: true,
    })
  },
  
  resetGame: () => {
    console.log('🔄 重置游戏')
    set({
      isPlaying: false,
      gameStarted: false,
      currentFrame: 1,
      currentThrow: 1,
      pinsStanding: 10,
      totalScore: 0,
      frameScores: Array(5).fill(0),
      throwsInFrame: Array(5).fill(0),
      canThrow: true,
      ballThrown: false,
      aimAngle: 0,
      lastKnockedDown: 0,
      showingResult: false
    })
  },
  
  throwBall: () => {
    if (get().canThrow) {
      set({ canThrow: false, ballThrown: true });
    }
  },
  
  processThrowResult: (knockedDownCount: number) => {
    const { currentFrame, currentThrow, pinsStanding } = get();
    console.log(`🧠 Processing: F${currentFrame} T${currentThrow}, Pins Standing: ${pinsStanding}, Knocked: ${knockedDownCount}`);

    set({ showingResult: true, lastKnockedDown: knockedDownCount });

    const advance = (nextState: Partial<GameState>) => {
      setTimeout(() => {
        set({ ...nextState, showingResult: false, canThrow: true, ballThrown: false });
      }, 2500); // 结果显示2.5秒
    };

    if (currentThrow === 1) {
      if (knockedDownCount >= pinsStanding) { // Strike
        console.log('🎉 STRIKE!');
        if (currentFrame === 5) {
          console.log('🏁 Game Over');
          get().resetGame();
        } else {
          advance({ currentFrame: currentFrame + 1, currentThrow: 1, pinsStanding: 10 });
        }
      } else { // Not a strike
        console.log('⚾️ Go for spare');
        advance({ currentThrow: 2, pinsStanding: pinsStanding - knockedDownCount });
      }
    } else { // Second throw
      if (currentFrame === 5) {
        console.log('🏁 Game Over');
        get().resetGame();
      } else {
        advance({ currentFrame: currentFrame + 1, currentThrow: 1, pinsStanding: 10 });
      }
    }
  },
  
  updateTilt: (x: number, y: number) => set({ tiltX: x, tiltY: y }),
  
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
  
  setAimAngle: (angle: number) => set({ aimAngle: angle }),
  setPower: (power: number) => set({ power: power }),
  
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
  },
})); 