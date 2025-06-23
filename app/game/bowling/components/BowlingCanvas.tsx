"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import * as THREE from "three"
import * as CANNON from "cannon-es"
import { useBowlingStore } from "../store"
import { toast } from 'react-hot-toast'

// 常量配置
const PHYSICS_CONFIG = {
  GRAVITY: -9.82, // 重力加速度
  BALL_MASS: 15, // 增加球的重量，提高冲击力image.png
  PIN_MASS: 0.1, // 大幅减少球瓶重量，让它们更容易倒下
  BALL_RADIUS: 0.6, // 减少球的半径，让它更小
  PIN_HEIGHT: 1.5, // 球瓶高度
  PIN_RADIUS_TOP: 0.15, // 球瓶顶部半径
  PIN_RADIUS_BOTTOM: 0.2, // 球瓶底部半径
  LANE_WIDTH: 5.0, // 增加球道宽度，给玩家更多操作空间
  LANE_LENGTH: 19.2, // 标准球道长度19.152米
  WALL_HEIGHT: 2, // 墙壁高度
  WALL_THICKNESS: 0.5, // 墙壁厚度
  THROW_TIMEOUT: 15000, // 增加到15秒，给球更多时间滚到球瓶
  PHYSICS_STEP: 1 / 60 // 物理步长
} as const

const MATERIALS_CONFIG = {
  BALL_GROUND: { friction: 0.08, restitution: 0.0 }, // 适当增加摩擦力，防止球滑太远
  BALL_PIN: { friction: 0.6, restitution: 0.1 }, // 大幅减少反弹，防止球往回走
  PIN_GROUND: { friction: 0.4, restitution: 0.05 }, // 减少球瓶反弹，让它们更容易倒下
  PIN_PIN: { friction: 0.4, restitution: 0.2 } // 减少球瓶间反弹
} as const

const CAMERA_CONFIG = {
  FOV: 75, // 视野角度
  NEAR: 0.1, // 近裁剪面
  FAR: 1000, // 远裁剪面
  INITIAL_POSITION: { x: 0, y: 8, z: 12 }, // 调整初始相机位置
  FOLLOW_OFFSET: { x: 0, y: 6, z: 8 }, // 跟随偏移
  FIXED_VIEW: { x: 0, y: 8, z: -12 }, // 调整固定观看位置
  LERP_SPEED: 0.1, // 线性插值速度
  SLOW_LERP_SPEED: 0.05 // 慢速线性插值速度
} as const

const PIN_POSITIONS = [
  [0, 1.0, -18.3], // 第1号球瓶，距离投球线18.288米（约-18.3）
  [-0.6, 1.0, -19.2], [0.6, 1.0, -19.2], // 第二排，增加间距
  [-1.2, 1.0, -20.1], [0, 1.0, -20.1], [1.2, 1.0, -20.1], // 第三排，增加间距
  [-1.8, 1.0, -21.0], [-0.6, 1.0, -21.0], [0.6, 1.0, -21.0], [1.8, 1.0, -21.0] // 第四排，增加间距
] as const

export function BowlingCanvas() {
  interface SceneRef {
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    world: CANNON.World
    ball: { mesh: THREE.Mesh; body: CANNON.Body } | null
    pins: Array<{ mesh: THREE.Mesh; body: CANNON.Body }>
    ground: { mesh: THREE.Mesh; body: CANNON.Body } | null
    animationId: number | null
    throwStartTime?: number
    aimLine?: THREE.Line
    powerBar?: THREE.Line
    materials: {
        groundMaterial: CANNON.Material;
        ballMaterial: CANNON.Material;
        pinMaterial: CANNON.Material;
    }
  }

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ballThrownRef = useRef(false)
  const canThrowRef = useRef(true)
  const showingResultRef = useRef(false)
  const sceneRef = useRef<SceneRef | null>(null)
  
  // 添加触摸控制状态
  const [isCharging, setIsCharging] = useState(false)
  const [chargePower, setChargePower] = useState(0)
  const [chargeStartTime, setChargeStartTime] = useState(0)
  const chargeIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [currentAimAngle, setCurrentAimAngle] = useState(0)
  
  // 手动控制状态
  const [isDragging, setIsDragging] = useState(false)

  const {
    ballThrown,
    canThrow,
    aimAngle,
    power,
    tiltX,
    gyroSupported,
    gyroPermission,
    lastKnockedDown,
    showingResult,
    currentFrame,
    processThrowResult,
    setPower,
    setAimAngle,
    throwBall,
  } = useBowlingStore()
  
  // 同步状态到ref
  useEffect(() => {
    ballThrownRef.current = ballThrown
    console.log('🎳 ballThrown状态更新:', ballThrown)
  }, [ballThrown])

  useEffect(() => {
    canThrowRef.current = canThrow
  }, [canThrow])

  useEffect(() => {
    showingResultRef.current = showingResult
  }, [showingResult])

  // 实时更新瞄准角度（根据陀螺仪数据或默认角度）
  useEffect(() => {
    if (canThrow && !ballThrown && !showingResult) {
      let newAngle = 0
      
      // 如果陀螺仪可用且有权限，使用陀螺仪数据
      if (gyroSupported && gyroPermission) {
        newAngle = Math.max(-30, Math.min(30, tiltX * 30)) // 限制角度范围并将陀螺仪数据转换为角度
      } else {
        // 如果陀螺仪不可用，使用store中的角度（可以通过其他方式设置）
        newAngle = aimAngle
      }
      
      setCurrentAimAngle(newAngle)
      
      // 只有在陀螺仪可用时才更新store中的角度
      if (gyroSupported && gyroPermission) {
        setAimAngle(newAngle)
      }
    }
  }, [tiltX, aimAngle, canThrow, ballThrown, showingResult, gyroSupported, gyroPermission, setAimAngle])

  // 手动角度调整函数
  const updateManualAngle = useCallback((event: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!canvasRef.current || (gyroSupported && gyroPermission)) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    let clientX = 0
    
    if ('clientX' in event) {
      clientX = event.clientX
    } else if ('touches' in event && event.touches.length > 0) {
      clientX = event.touches[0].clientX
    }
    
    const centerX = rect.left + rect.width / 2
    const offsetX = clientX - centerX
    const maxOffset = rect.width / 4 // 使用屏幕宽度的1/4作为最大偏移
    const normalizedOffset = Math.max(-1, Math.min(1, offsetX / maxOffset))
    const newAngle = normalizedOffset * 30 // 最大30度角度
    
    setCurrentAimAngle(newAngle)
    setAimAngle(newAngle)
  }, [gyroSupported, gyroPermission, setAimAngle])

  // 开始蓄力
  const startCharging = useCallback((event?: React.MouseEvent | React.TouchEvent) => {
    if (!canThrow || ballThrown || showingResult) return
    
    console.log('🎯 开始蓄力')
    setIsCharging(true)
    setIsDragging(true)
    setChargePower(20) // 起始力度
    const startTime = Date.now()
    setChargeStartTime(startTime)
    console.log('⏱️ 蓄力开始时间:', startTime)
    
    // 如果没有陀螺仪支持，使用鼠标/触摸位置来设置角度
    if (event && (!gyroSupported || !gyroPermission)) {
      updateManualAngle(event)
    }
    
    chargeIntervalRef.current = setInterval(() => {
      setChargePower(prev => {
        const next = prev + 2
        return next > 100 ? 20 : next // 循环蓄力
      })
    }, 50)
  }, [canThrow, ballThrown, showingResult, gyroSupported, gyroPermission, updateManualAngle])

  // 结束蓄力并投球
  const endCharging = useCallback(() => {
    if (!isCharging) return
    
    const chargeDuration = Date.now() - chargeStartTime
    console.log('🚀 结束蓄力，投球！', { 
      power: chargePower, 
      angle: currentAimAngle,
      chargeDuration: `${chargeDuration}ms`
    })
    setIsCharging(false)
    setIsDragging(false)
    if (chargeIntervalRef.current) {
      clearInterval(chargeIntervalRef.current)
      chargeIntervalRef.current = null
    }
    
    // 设置力度并投球
    setPower(chargePower)
    throwBall()
    setChargePower(0)
  }, [isCharging, chargePower, currentAimAngle, chargeStartTime, setPower, throwBall])

  // 处理鼠标/触摸移动事件
  useEffect(() => {
    if (!isDragging || !isCharging) return

    const handleMouseMove = (event: MouseEvent) => {
      updateManualAngle(event)
    }

    const handleTouchMove = (event: TouchEvent) => {
      event.preventDefault()
      updateManualAngle(event)
    }

    const handleMouseUp = () => {
      endCharging()
    }

    const handleTouchEnd = () => {
      endCharging()
    }

    if (!gyroSupported || !gyroPermission) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchend', handleTouchEnd)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isDragging, isCharging, gyroSupported, gyroPermission, updateManualAngle, endCharging])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (chargeIntervalRef.current) {
        clearInterval(chargeIntervalRef.current)
      }
    }
  }, [])

  // 创建物理材料和接触材料
  const createPhysicsMaterials = useCallback((world: CANNON.World) => {
    const groundMaterial = new CANNON.Material('ground')
    const ballMaterial = new CANNON.Material('ball')
    const pinMaterial = new CANNON.Material('pin')

    const createContactMaterial = (mat1: CANNON.Material, mat2: CANNON.Material, config: { friction: number; restitution: number }) => {
      return new CANNON.ContactMaterial(mat1, mat2, {
        ...config,
        contactEquationStiffness: 1e8,
        contactEquationRelaxation: 3,
        frictionEquationStiffness: 1e8,
        frictionEquationRelaxation: 3
      })
    }

    world.addContactMaterial(createContactMaterial(ballMaterial, groundMaterial, MATERIALS_CONFIG.BALL_GROUND))
    world.addContactMaterial(createContactMaterial(ballMaterial, pinMaterial, MATERIALS_CONFIG.BALL_PIN))
    world.addContactMaterial(createContactMaterial(pinMaterial, groundMaterial, MATERIALS_CONFIG.PIN_GROUND))
    world.addContactMaterial(createContactMaterial(pinMaterial, pinMaterial, MATERIALS_CONFIG.PIN_PIN))

    return { groundMaterial, ballMaterial, pinMaterial }
  }, [])

  // 创建场景元素
  const createSceneElements = useCallback((scene: THREE.Scene, world: CANNON.World, materials: ReturnType<typeof createPhysicsMaterials>) => {
    // 创建更大的地面，延伸到球瓶后面
    const groundGeometry = new THREE.PlaneGeometry(25, 50) // 大幅增加地面尺寸
    const groundMesh = new THREE.Mesh(
      groundGeometry,
      new THREE.MeshPhongMaterial({ 
        color: 0x2a2a2a, // 深色地面
        shininess: 30,
        specular: 0x111111
      })
    )
    groundMesh.rotation.x = -Math.PI / 2
    groundMesh.position.z = -5 // 调整地面中心位置
    groundMesh.receiveShadow = true
    scene.add(groundMesh)

    // 创建木质纹理球道 - 扩展到完整长度
    const fullLaneLength = 35 // 进一步增加球道长度，确保覆盖所有区域
    const laneGeometry = new THREE.PlaneGeometry(PHYSICS_CONFIG.LANE_WIDTH, fullLaneLength)
    const laneMesh = new THREE.Mesh(
      laneGeometry,
      new THREE.MeshPhongMaterial({ 
        color: 0xdeb887, // 浅木色
        shininess: 80, // 增加光泽度
        specular: 0x444444, // 镜面反射
        transparent: true,
        opacity: 0.95
      })
    )
    laneMesh.rotation.x = -Math.PI / 2
    laneMesh.position.y = 0.01
    laneMesh.position.z = -7.5 // 进一步向后移动，确保覆盖球瓶区域
    laneMesh.receiveShadow = true
    laneMesh.castShadow = false
    scene.add(laneMesh)

    // 添加投球助跑区域 - 在球道前面
    const approachLength = 5 // 助跑区长度
    const approachGeometry = new THREE.PlaneGeometry(PHYSICS_CONFIG.LANE_WIDTH, approachLength)
    const approachMesh = new THREE.Mesh(
      approachGeometry,
      new THREE.MeshPhongMaterial({ 
        color: 0xc8a882, // 稍微深一点的木色，区分助跑区
        shininess: 70,
        specular: 0x333333
      })
    )
    approachMesh.rotation.x = -Math.PI / 2
    approachMesh.position.y = 0.005 // 稍微低一点，避免Z-fighting
    approachMesh.position.z = 10 // 在球道前面
    approachMesh.receiveShadow = true
    scene.add(approachMesh)

    // 添加球道边缘装饰线 - 延伸到完整长度
    const edgeGeometry = new THREE.PlaneGeometry(0.1, fullLaneLength)
    const edgeMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 }) // 深棕色边线
    
    // 左边线
    const leftEdge = new THREE.Mesh(edgeGeometry, edgeMaterial)
    leftEdge.rotation.x = -Math.PI / 2
    leftEdge.position.set(-PHYSICS_CONFIG.LANE_WIDTH/2, 0.02, -5)
    scene.add(leftEdge)
    
    // 右边线
    const rightEdge = new THREE.Mesh(edgeGeometry, edgeMaterial)
    rightEdge.rotation.x = -Math.PI / 2
    rightEdge.position.set(PHYSICS_CONFIG.LANE_WIDTH/2, 0.02, -5)
    scene.add(rightEdge)

    // 添加助跑区边线
    const approachEdgeGeometry = new THREE.PlaneGeometry(0.1, approachLength)
    
    // 助跑区左边线
    const approachLeftEdge = new THREE.Mesh(approachEdgeGeometry, edgeMaterial)
    approachLeftEdge.rotation.x = -Math.PI / 2
    approachLeftEdge.position.set(-PHYSICS_CONFIG.LANE_WIDTH/2, 0.015, 10)
    scene.add(approachLeftEdge)
    
    // 助跑区右边线
    const approachRightEdge = new THREE.Mesh(approachEdgeGeometry, edgeMaterial)
    approachRightEdge.rotation.x = -Math.PI / 2
    approachRightEdge.position.set(PHYSICS_CONFIG.LANE_WIDTH/2, 0.015, 10)
    scene.add(approachRightEdge)

    // 物理地面 - 扩大物理地面范围
    const groundShape = new CANNON.Plane()
    const groundBody = new CANNON.Body({ mass: 0, material: materials.groundMaterial })
    groundBody.addShape(groundShape)
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
    world.addBody(groundBody)

    return { groundMesh, groundBody }
  }, [])

  // 创建球
  const createBall = useCallback((scene: THREE.Scene, world: CANNON.World, ballMaterial: CANNON.Material) => {
    const ballGeometry = new THREE.SphereGeometry(PHYSICS_CONFIG.BALL_RADIUS, 32, 32)
    const ballMesh = new THREE.Mesh(
      ballGeometry,
      new THREE.MeshPhongMaterial({ 
        color: 0xcc0000, // 深红色
        shininess: 100, // 高光泽度
        specular: 0x666666, // 镜面反射
        emissive: 0x220000, // 轻微发光
        transparent: false
      })
    )
    ballMesh.position.set(0, 1, 10)
    ballMesh.castShadow = true
    ballMesh.receiveShadow = true
    scene.add(ballMesh)

    const ballShape = new CANNON.Sphere(PHYSICS_CONFIG.BALL_RADIUS)
    const ballBody = new CANNON.Body({ 
      mass: PHYSICS_CONFIG.BALL_MASS,
      material: ballMaterial,
      linearDamping: 0.1, // 增加线性阻尼，让球更快停下，防止往回走
      angularDamping: 0.05, // 适当增加角度阻尼
      fixedRotation: false,
      type: CANNON.Body.DYNAMIC
    })
    ballBody.addShape(ballShape)
    ballBody.position.set(0, 1, 10)
    world.addBody(ballBody)

    return { mesh: ballMesh, body: ballBody }
  }, [])

  // 创建球瓶
  const createPins = useCallback((scene: THREE.Scene, world: CANNON.World, pinMaterial: CANNON.Material) => {
    const pinGeometry = new THREE.CylinderGeometry(
      PHYSICS_CONFIG.PIN_RADIUS_TOP, 
      PHYSICS_CONFIG.PIN_RADIUS_BOTTOM, 
      PHYSICS_CONFIG.PIN_HEIGHT, 
      12 // 增加分段数让球瓶更圆滑
    )
    
    // 创建球瓶材质 - 白色底色，高光泽
    const pinMaterial3D = new THREE.MeshPhongMaterial({ 
      color: 0xffffff, // 纯白色
      shininess: 120, // 高光泽度
      specular: 0x888888, // 强镜面反射
      transparent: false
    })
    
    const pinMeshes: THREE.Mesh[] = []
    const pinBodies: CANNON.Body[] = []

    PIN_POSITIONS.forEach((pos) => {
      // 创建球瓶主体
      const pinMesh = new THREE.Mesh(pinGeometry, pinMaterial3D)
      pinMesh.position.set(pos[0], pos[1], pos[2])
      pinMesh.castShadow = true
      pinMesh.receiveShadow = true
      scene.add(pinMesh)
      
      pinMeshes.push(pinMesh)

      const pinShape = new CANNON.Cylinder(
        PHYSICS_CONFIG.PIN_RADIUS_TOP, 
        PHYSICS_CONFIG.PIN_RADIUS_BOTTOM, 
        PHYSICS_CONFIG.PIN_HEIGHT, 
        8
      )
      const pinBody = new CANNON.Body({ 
        mass: PHYSICS_CONFIG.PIN_MASS,
        material: pinMaterial,
        linearDamping: 0.2, // 增加球瓶阻尼，让它们被撞击后更快稳定
        angularDamping: 0.3 // 增加角度阻尼，让球瓶倒下后不会过度旋转
      })
      pinBody.addShape(pinShape)
      pinBody.position.set(pos[0], pos[1], pos[2])
      world.addBody(pinBody)
      pinBodies.push(pinBody)
    })

    return pinMeshes.map((mesh, index) => ({ mesh, body: pinBodies[index] }))
  }, [])

  // 创建边界墙
  const createWalls = useCallback((scene: THREE.Scene, world: CANNON.World) => {
    const createWall = (x: number) => {
      const wallGeometry = new THREE.BoxGeometry(PHYSICS_CONFIG.WALL_THICKNESS, PHYSICS_CONFIG.WALL_HEIGHT, 35) // 增加墙壁长度
      const wallMesh = new THREE.Mesh(
        wallGeometry,
        new THREE.MeshLambertMaterial({ color: 0x666666 })
      )
      wallMesh.position.set(x, PHYSICS_CONFIG.WALL_HEIGHT/2, -2) // 调整墙壁位置对应地面中心
      scene.add(wallMesh)

      const wallShape = new CANNON.Box(new CANNON.Vec3(PHYSICS_CONFIG.WALL_THICKNESS/2, PHYSICS_CONFIG.WALL_HEIGHT/2, 17.5)) // 调整墙壁碰撞体积
      const wallBody = new CANNON.Body({ mass: 0 })
      wallBody.addShape(wallShape)
      wallBody.position.set(x, PHYSICS_CONFIG.WALL_HEIGHT/2, -2)
      world.addBody(wallBody)
    }

    createWall(-3) // 左墙，调整位置适应更宽的球道
    createWall(3)  // 右墙
  }, [])

  // 添加照明
  const createLighting = useCallback((scene: THREE.Scene) => {
    // 环境光 - 提供基础照明
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4) // 降低环境光强度
    scene.add(ambientLight)

    // 主要方向光 - 模拟天花板照明
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8)
    mainLight.position.set(0, 15, -5)
    mainLight.target.position.set(0, 0, -15)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 4096
    mainLight.shadow.mapSize.height = 4096
    mainLight.shadow.camera.near = 0.1
    mainLight.shadow.camera.far = 50
    mainLight.shadow.camera.left = -20
    mainLight.shadow.camera.right = 20
    mainLight.shadow.camera.top = 20
    mainLight.shadow.camera.bottom = -20
    scene.add(mainLight)

    // 球道聚光灯 - 照亮球道
    const laneSpotLight = new THREE.SpotLight(0xffffff, 1.2)
    laneSpotLight.position.set(0, 12, 0)
    laneSpotLight.target.position.set(0, 0, -10)
    laneSpotLight.angle = Math.PI / 6 // 30度角
    laneSpotLight.penumbra = 0.3 // 边缘柔化
    laneSpotLight.decay = 2
    laneSpotLight.distance = 30
    laneSpotLight.castShadow = true
    laneSpotLight.shadow.mapSize.width = 2048
    laneSpotLight.shadow.mapSize.height = 2048
    scene.add(laneSpotLight)

    // 球瓶区聚光灯 - 突出球瓶
    const pinSpotLight = new THREE.SpotLight(0xffffff, 1.0)
    pinSpotLight.position.set(0, 10, -15)
    pinSpotLight.target.position.set(0, 0, -19)
    pinSpotLight.angle = Math.PI / 8 // 22.5度角
    pinSpotLight.penumbra = 0.2
    pinSpotLight.decay = 2
    pinSpotLight.distance = 20
    pinSpotLight.castShadow = true
    scene.add(pinSpotLight)

    // 侧面补光灯 - 增加立体感
    const sideLight1 = new THREE.DirectionalLight(0xffffff, 0.3)
    sideLight1.position.set(-10, 8, -10)
    sideLight1.target.position.set(0, 0, -15)
    scene.add(sideLight1)

    const sideLight2 = new THREE.DirectionalLight(0xffffff, 0.3)
    sideLight2.position.set(10, 8, -10)
    sideLight2.target.position.set(0, 0, -15)
    scene.add(sideLight2)

    // 背景点光源 - 营造氛围
    const backLight = new THREE.PointLight(0x444444, 0.5, 30)
    backLight.position.set(0, 5, -25)
    scene.add(backLight)
  }, [])

  // 更新相机位置
  const updateCamera = useCallback((camera: THREE.PerspectiveCamera, ballPosition: CANNON.Vec3) => {
    const targetZ = ballPosition.z < 0 ? ballPosition.z + 15 : CAMERA_CONFIG.INITIAL_POSITION.z;
    const targetY = ballPosition.z < 0 ? ballPosition.y + 5 : CAMERA_CONFIG.INITIAL_POSITION.y;
    
    const targetPosition = new THREE.Vector3(
      CAMERA_CONFIG.INITIAL_POSITION.x,
      targetY,
      targetZ
    );
    
    // 如果不在显示结果，则平滑移动相机
    if (!showingResult) {
       camera.position.lerp(targetPosition, 0.05);
       camera.lookAt(0, ballPosition.y, ballPosition.z - 5);
    }
  }, [showingResult]);

  // 检查投球状态
  const checkBallStatus = useCallback((ballBody: CANNON.Body, throwStartTime: number | null): boolean => {
    if (!ballThrownRef.current || !throwStartTime) return false

    const velocity = ballBody.velocity
    const position = ballBody.position
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z)
    
    const currentTime = Date.now()
    const elapsedTime = currentTime - throwStartTime
    
    // 检查球是否静止（速度很小且持续一段时间）
    const isStationary = speed < 0.05 && elapsedTime > 4000 // 球速度小于0.05且已经4秒后，给球瓶更多时间倒下
    
    // 检查球是否到达球瓶区域且静止
    // const reachedPinArea = position.z < -15 && isStationary
    
    // 检查边界 - 球超出边界立即结束
    const outOfBounds = position.y < -5 || position.z < -30 || position.z > 15 || Math.abs(position.x) > 12
    
    if (outOfBounds) {
      console.log('🚨 球超出边界，立即处理结果', { 
        y: position.y.toFixed(2), 
        z: position.z.toFixed(2), 
        x: position.x.toFixed(2)
      })
      return true
    }
    
    if (isStationary) {
      console.log('⏸️ 球已静止，处理结果', { 
        speed: speed.toFixed(3),
        elapsedTime,
        position: { x: position.x.toFixed(2), y: position.y.toFixed(2), z: position.z.toFixed(2) }
      })
      return true
    }

    // 15秒时间限制作为最后的安全网
    if (elapsedTime > PHYSICS_CONFIG.THROW_TIMEOUT) {
      console.log('⏰ 投球时间到（15秒），强制处理结果', { 
        elapsedTime, 
        ballPosition: { x: position.x.toFixed(2), y: position.y.toFixed(2), z: position.z.toFixed(2) },
        speed: speed.toFixed(2)
      })
      return true
    }

    return false
  }, [])

  // 处理投球结果 (现在包含击倒检测)
  const processBallResult = useCallback(() => {
    console.log('🎳 处理投球结果开始');
    
    let knockedDownCount = 0;
    if (sceneRef.current?.pins) {
      sceneRef.current.pins.forEach((pin, index) => {
        const rotation = pin.body.quaternion;
        const position = pin.body.position;
        const rotationMatrix = new THREE.Matrix4().makeRotationFromQuaternion(
          new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w)
        );
        const upVector = new THREE.Vector3(0, 1, 0).applyMatrix4(rotationMatrix);
        const tiltAngle = Math.acos(Math.abs(upVector.y));
        const isKnockedDown = tiltAngle > 0.785 || position.y < 0.3;
        
        if (isKnockedDown) {
          knockedDownCount++;
        }
      });
    }
    
    console.log(`🎳 最终击倒球瓶数: ${knockedDownCount}`);
    
    // 调用 store action 来处理分数和状态转换
    processThrowResult(knockedDownCount);
  }, [processThrowResult]);

  // ==================================================================
  // 最终的场景重置逻辑
  // ==================================================================

  const resetSceneForNewRound = useCallback(() => {
    if (!sceneRef.current || !sceneRef.current.scene || !sceneRef.current.world || !sceneRef.current.materials) {
      console.error("⚠️ 无法重置场景：缺少必要的引用。");
      return;
    }
    console.log(`🚀 为第 ${currentFrame} 轮重置整个场景...`);

    const { scene, world, materials, ball, pins } = sceneRef.current;
    
    // 1. 移除旧的球
    if (ball) {
      scene.remove(ball.mesh);
      world.removeBody(ball.body);
    }

    // 2. 移除旧的球瓶
    if (pins) {
      pins.forEach(pin => {
        scene.remove(pin.mesh);
        world.removeBody(pin.body);
      });
    }

    // 3. 创建新的球和球瓶
    const newBall = createBall(scene, world, materials.ballMaterial);
    const newPins = createPins(scene, world, materials.pinMaterial);
    
    // 4. 更新 sceneRef
    sceneRef.current.ball = newBall;
    sceneRef.current.pins = newPins;
    
    // 5. 重置相机
    if (sceneRef.current.camera) {
        // 直接设置相机位置，而不是平滑移动
        sceneRef.current.camera.position.set(
            CAMERA_CONFIG.INITIAL_POSITION.x,
            CAMERA_CONFIG.INITIAL_POSITION.y,
            CAMERA_CONFIG.INITIAL_POSITION.z
        );
        sceneRef.current.camera.lookAt(0, 0, 0);
    }
    
    console.log('✅ 场景重置完成');
  }, [currentFrame, createBall, createPins]);

  // 唯一的重置触发器：当轮次改变时重置场景
  useEffect(() => {
    // 忽略第一轮的初始化，因为它已经在主useEffect中完成了
    if (currentFrame > 1) {
      resetSceneForNewRound();
    }
  }, [currentFrame, resetSceneForNewRound]);

  // 监听投球事件
  useEffect(() => {
    if (!ballThrown || !sceneRef.current?.ball) return

    ballThrownRef.current = true
    console.log('🎳 Three.js 投球！', { aimAngle, power })

    const angleRad = (aimAngle * Math.PI) / 180
    const basePower = 300 // 进一步增加基础力度
    const powerMultiplier = power / 100 // 将力度百分比转换为乘数
    const force = basePower * powerMultiplier // 根据力度调整最终力度
    const velocityScale = 0.03 // 增加速度缩放因子

    // 设置球的速度
    sceneRef.current.ball.body.velocity.set(
      Math.sin(angleRad) * force * velocityScale * 0.3,
      0,
      -force * velocityScale
    )
    
    // 应用冲量
    const forceVector = new CANNON.Vec3(
      Math.sin(angleRad) * force * 0.2, // 减少侧向力，增加前进稳定性
      -3, // 增加向下的力，防止球弹跳
      -force * 1.0 // 增加前进力
    )
    sceneRef.current.ball.body.applyImpulse(forceVector, sceneRef.current.ball.body.position)
    
    // 重置投球计时器
    sceneRef.current.throwStartTime = Date.now()
    
    console.log('🎳 投球完成', { 
      power,
      force,
      angle: aimAngle,
      ballMass: sceneRef.current.ball.body.mass,
      velocitySet: {
        x: (Math.sin(angleRad) * force * velocityScale * 0.3).toFixed(3),
        z: (-force * velocityScale).toFixed(3)
      }
    })

    // 新逻辑：使用 Zustand store action
    processBallResult()

  }, [ballThrown, aimAngle, power, processBallResult])

  // 初始化 Three.js 场景
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a1a) // 更深的背景色，营造室内保龄球馆氛围
    scene.fog = new THREE.Fog(0x1a1a1a, 30, 60) // 调整雾效范围适应更大的场景

    // 相机设置
    const camera = new THREE.PerspectiveCamera(
      CAMERA_CONFIG.FOV,
      canvas.clientWidth / canvas.clientHeight,
      CAMERA_CONFIG.NEAR,
      CAMERA_CONFIG.FAR
    )
    camera.position.set(CAMERA_CONFIG.INITIAL_POSITION.x, CAMERA_CONFIG.INITIAL_POSITION.y, CAMERA_CONFIG.INITIAL_POSITION.z)
    camera.lookAt(0, 0, 0)

    // 渲染器设置
    const renderer = new THREE.WebGLRenderer({ 
      canvas,
      antialias: true,
      alpha: false, // 禁用透明度以提高性能
      powerPreference: "high-performance"
    })
    renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // 限制像素比以提高性能
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap // 使用软阴影
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping // 添加色调映射
    renderer.toneMappingExposure = 1.2 // 调整曝光度

    // 物理世界
    const world = new CANNON.World()
    world.gravity.set(0, PHYSICS_CONFIG.GRAVITY, 0)
    world.broadphase = new CANNON.NaiveBroadphase()
    world.defaultContactMaterial.friction = 0.1 // 进一步减少默认摩擦力，模拟更光滑的环境
    world.defaultContactMaterial.restitution = 0.3

    // 创建场景元素
    const materials = createPhysicsMaterials(world)
    const { groundMesh, groundBody } = createSceneElements(scene, world, materials)
    const ball = createBall(scene, world, materials.ballMaterial)
    const pins = createPins(scene, world, materials.pinMaterial)
    
    createWalls(scene, world)
    createLighting(scene)

    // 存储场景引用
    sceneRef.current = {
      scene,
      camera,
      renderer,
      world,
      ball,
      pins,
      ground: { mesh: groundMesh, body: groundBody },
      animationId: null,
      materials: materials,
    }

    // 动画循环
    const animate = () => {
      if (!sceneRef.current) return

      // 更新物理世界
      world.step(PHYSICS_CONFIG.PHYSICS_STEP, PHYSICS_CONFIG.PHYSICS_STEP, 3)

      // 同步球的位置
      if (sceneRef.current.ball) {
        sceneRef.current.ball.mesh.position.copy(sceneRef.current.ball.body.position as unknown as THREE.Vector3)
        sceneRef.current.ball.mesh.quaternion.copy(sceneRef.current.ball.body.quaternion as unknown as THREE.Quaternion)
        
        // 更新相机
        updateCamera(sceneRef.current.camera, sceneRef.current.ball.body.position)
      }

      // 同步球瓶位置
      sceneRef.current.pins.forEach((pin) => {
        pin.mesh.position.copy(pin.body.position as unknown as THREE.Vector3)
        pin.mesh.quaternion.copy(pin.body.quaternion as unknown as THREE.Quaternion)
      })

      // 检查球状态
      if (sceneRef.current.ball && checkBallStatus(sceneRef.current.ball.body, sceneRef.current.throwStartTime ?? null)) {
        ballThrownRef.current = false; // 防止重复触发
        processBallResult();
        return
      }

      renderer.render(scene, camera)
      sceneRef.current.animationId = requestAnimationFrame(animate)
    }

    animate()

    // 处理窗口大小变化
    const handleResize = () => {
      if (!sceneRef.current || !canvasRef.current) return
      
      const width = canvasRef.current.clientWidth
      const height = canvasRef.current.clientHeight
      
      sceneRef.current.camera.aspect = width / height
      sceneRef.current.camera.updateProjectionMatrix()
      sceneRef.current.renderer.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (sceneRef.current?.animationId) {
        cancelAnimationFrame(sceneRef.current.animationId)
      }
      sceneRef.current?.renderer.dispose()
    }
  }, []) // 依赖项数组保持为空，确保只在挂载时运行一次

  return (
    <div className="relative w-full h-[600px] bg-gradient-to-b from-sky-200 to-sky-100 rounded-lg overflow-hidden">
      <canvas 
        ref={canvasRef}
        className="w-full h-full cursor-pointer"
        style={{ display: 'block' }}
        onMouseDown={(e) => startCharging(e)}
        onMouseUp={endCharging}
        onMouseLeave={endCharging}
        onTouchStart={(e) => {
          e.preventDefault()
          startCharging(e)
        }}
        onTouchEnd={(e) => {
          e.preventDefault()
          endCharging()
        }}
        onTouchCancel={(e) => {
          e.preventDefault()
          endCharging()
        }}
      />
      
      {/* 瞄准线和力度条 */}
      {canThrow && !ballThrown && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2" style={{ left: '61%' }}>
          <div 
            className="w-0.5 h-100 origin-bottom transition-transform duration-100 relative"
            style={{ 
              transform: `translateX(-50%) rotate(${currentAimAngle}deg)`,
              transformOrigin: 'bottom center',
              background: 'repeating-linear-gradient(to top, #ef4444 0px, #ef4444 8px, transparent 8px, transparent 16px)'
            }}
          >
            {/* 力度条叠加在虚线上 */}
            {isCharging && (
              <div 
                className="absolute bottom-0 left-0 w-full transition-all duration-75"
                style={{ 
                  height: `${chargePower}%`,
                  background: `linear-gradient(to top, 
                    ${chargePower < 30 ? '#22c55e' : 
                      chargePower < 70 ? '#eab308' : '#ef4444'} 0%, 
                    ${chargePower < 30 ? '#16a34a' : 
                      chargePower < 70 ? '#ca8a04' : '#dc2626'} 100%)`,
                  opacity: 0.9,
                  borderRadius: '1px',
                  boxShadow: '0 0 4px rgba(255,255,255,0.5)'
                }}
              />
            )}
          </div>
          <div className="text-center text-white text-sm mt-2 bg-black/50 px-2 py-1 rounded">
            {isCharging ? (
              <div>
                <div className="font-bold">💪 {chargePower}%</div>
                <div className="text-xs">蓄力中...</div>
              </div>
            ) : (
              <div>
                <div>角度: {currentAimAngle.toFixed(1)}°</div>
                {gyroSupported && gyroPermission && (
                  <div className="text-xs text-green-300">🎯 陀螺仪已启用</div>
                )}
                {gyroSupported && !gyroPermission && (
                  <div className="text-xs text-yellow-300">⚠️ 需要陀螺仪权限</div>
                )}
                {!gyroSupported && (
                  <div className="text-xs text-gray-300">📱 手动控制</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 投球状态提示 */}
      {ballThrown && !showingResult && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600/90 text-white px-4 py-2 rounded-lg text-center">
          <div className="text-lg font-bold">🎳 投球中...</div>
          <div className="text-sm">球正在滚动</div>
        </div>
      )}
      
      {/* 结果显示 */}
      {showingResult && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-600/90 text-white px-6 py-3 rounded-lg text-center animate-pulse">
          <div className="text-xl font-bold">🎯 投球结果</div>
          <div className="text-lg">
            击倒 <span className="text-yellow-300 font-bold">{lastKnockedDown}</span> 个球瓶
          </div>
          <div className="text-sm">
            剩余 <span className="text-red-300 font-bold">{10 - lastKnockedDown}</span> 个球瓶
          </div>
          {lastKnockedDown === 10 && (
            <div className="text-lg font-bold text-yellow-300 mt-1">🎉 全中！</div>
          )}
        </div>
      )}
    </div>
  )
} 