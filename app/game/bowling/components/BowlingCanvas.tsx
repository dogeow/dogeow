"use client"

import { useEffect, useRef, useCallback } from "react"
import * as THREE from "three"
import * as CANNON from "cannon-es"
import { useBowlingStore } from "../store"

// 常量配置
const PHYSICS_CONFIG = {
  GRAVITY: -9.82,
  BALL_MASS: 10, // 减少球的重量，降低冲击力
  PIN_MASS: 0.8, // 增加球瓶重量，让它们更难倒下
  BALL_RADIUS: 0.6, // 减少球的半径，让它更小
  PIN_HEIGHT: 1.5,
  PIN_RADIUS_TOP: 0.15,
  PIN_RADIUS_BOTTOM: 0.2,
  LANE_WIDTH: 5.0, // 增加球道宽度，给玩家更多操作空间
  LANE_LENGTH: 19.2, // 标准球道长度19.152米
  WALL_HEIGHT: 2,
  WALL_THICKNESS: 0.5,
  THROW_TIMEOUT: 15000, // 增加到15秒，给球更多时间滚到球瓶
  PHYSICS_STEP: 1 / 60
} as const

const MATERIALS_CONFIG = {
  BALL_GROUND: { friction: 0.1, restitution: 0.0 }, // 大幅减少摩擦力，模拟光滑球道
  BALL_PIN: { friction: 0.6, restitution: 0.5 },
  PIN_GROUND: { friction: 0.8, restitution: 0.1 }, // 增加球瓶与地面摩擦力，让球瓶更稳定
  PIN_PIN: { friction: 0.4, restitution: 0.5 }
} as const

const CAMERA_CONFIG = {
  FOV: 75,
  NEAR: 0.1,
  FAR: 1000,
  INITIAL_POSITION: { x: 0, y: 8, z: 12 }, // 调整初始相机位置
  FOLLOW_OFFSET: { x: 0, y: 6, z: 8 },
  FIXED_VIEW: { x: 0, y: 8, z: -12 }, // 调整固定观看位置
  LERP_SPEED: 0.1,
  SLOW_LERP_SPEED: 0.05
} as const

const PIN_POSITIONS = [
  [0, 1.0, -18.3], // 第1号球瓶，距离投球线18.288米（约-18.3）
  [-0.6, 1.0, -19.2], [0.6, 1.0, -19.2], // 第二排，增加间距
  [-1.2, 1.0, -20.1], [0, 1.0, -20.1], [1.2, 1.0, -20.1], // 第三排，增加间距
  [-1.8, 1.0, -21.0], [-0.6, 1.0, -21.0], [0.6, 1.0, -21.0], [1.8, 1.0, -21.0] // 第四排，增加间距
] as const

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
}

export function BowlingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ballThrownRef = useRef(false)
  const sceneRef = useRef<SceneRef | null>(null)

  const {
    ballThrown,
    canThrow,
    aimAngle,
    processBallResult
  } = useBowlingStore()
  
  // 同步ballThrown状态到ref
  useEffect(() => {
    ballThrownRef.current = ballThrown
    console.log('🎳 ballThrown状态更新:', ballThrown)
  }, [ballThrown])

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
      linearDamping: 0.05, // 大幅减少线性阻尼，让球保持速度
      angularDamping: 0.05, // 大幅减少角度阻尼，让旋转保持更久
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
        linearDamping: 0.2, // 增加球瓶阻尼，让它们移动时减速更快
        angularDamping: 0.2 // 增加角度阻尼，减少旋转
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

  // 检测球瓶状态并处理投球结果
  const processBallResultWithDetection = useCallback(() => {
    let knockedDownCount = 0
    
    if (sceneRef.current?.pins) {
      sceneRef.current.pins.forEach((pin, index) => {
        const rotation = pin.body.quaternion
        const angle = Math.abs(rotation.x) + Math.abs(rotation.z)
        const position = pin.body.position
        
        if (angle > 0.3 || position.y < 0.5) {
          knockedDownCount++
          console.log(`🎯 球瓶 ${index + 1} 被击倒`, { 
            angle: angle.toFixed(2), 
            y: position.y.toFixed(2) 
          })
        }
      })
    }
    
    console.log(`🎳 实际击倒球瓶数: ${knockedDownCount}/10`)
    processBallResult(knockedDownCount)
  }, [processBallResult])

  // 更新相机位置
  const updateCamera = useCallback((camera: THREE.PerspectiveCamera, ballPosition: CANNON.Vec3) => {
    if (ballThrownRef.current) {
      if (ballPosition.z > -15) { // 调整相机跟随条件适应新球道长度
        // 相机跟随球
        const cameraOffset = {
          x: ballPosition.x,
          y: ballPosition.y + CAMERA_CONFIG.FOLLOW_OFFSET.y,
          z: ballPosition.z + CAMERA_CONFIG.FOLLOW_OFFSET.z
        }
        
        camera.position.lerp(
          new THREE.Vector3(cameraOffset.x, cameraOffset.y, cameraOffset.z),
          CAMERA_CONFIG.LERP_SPEED
        )
        
        camera.lookAt(ballPosition.x, ballPosition.y, ballPosition.z - 5)
      } else {
        // 固定观看位置
        camera.position.lerp(
          new THREE.Vector3(CAMERA_CONFIG.FIXED_VIEW.x, CAMERA_CONFIG.FIXED_VIEW.y, CAMERA_CONFIG.FIXED_VIEW.z),
          CAMERA_CONFIG.SLOW_LERP_SPEED
        )
        camera.lookAt(0, 0, -19) // 调整观看目标到球瓶区域
      }
    } else {
      // 恢复默认位置
      camera.position.lerp(
        new THREE.Vector3(CAMERA_CONFIG.INITIAL_POSITION.x, CAMERA_CONFIG.INITIAL_POSITION.y, CAMERA_CONFIG.INITIAL_POSITION.z),
        CAMERA_CONFIG.SLOW_LERP_SPEED
      )
      camera.lookAt(0, 0, 0)
    }
  }, [])

  // 检查投球状态
  const checkBallStatus = useCallback((ballBody: CANNON.Body, throwStartTime?: number) => {
    if (!ballThrownRef.current || !throwStartTime) return false

    const velocity = ballBody.velocity
    const position = ballBody.position
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z)
    
    const currentTime = Date.now()
    const elapsedTime = currentTime - throwStartTime
    
    // 检查边界 - 调整边界适应新球道长度
    if (position.y < -5 || position.z < -25 || position.z > 15 || Math.abs(position.x) > 10) {
      console.log('🚨 球超出边界，但继续游戏直到15秒', { 
        y: position.y, 
        z: position.z, 
        x: position.x
      })
    }

    // 15秒时间限制，给较慢的球更多时间
    if (elapsedTime > PHYSICS_CONFIG.THROW_TIMEOUT) {
      console.log('⏰ 投球时间到（15秒），处理结果', { 
        elapsedTime, 
        ballPosition: { x: position.x.toFixed(2), y: position.y.toFixed(2), z: position.z.toFixed(2) },
        speed: speed.toFixed(2)
      })
      return true
    }

    return false
  }, [])

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
    world.defaultContactMaterial.friction = 0.2 // 减少默认摩擦力，模拟光滑环境
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
      animationId: null
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
      if (sceneRef.current.ball && checkBallStatus(sceneRef.current.ball.body, sceneRef.current.throwStartTime)) {
        processBallResultWithDetection()
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
  }, [createPhysicsMaterials, createSceneElements, createBall, createPins, createWalls, createLighting, updateCamera, checkBallStatus, processBallResultWithDetection])

  // 监听投球事件
  useEffect(() => {
    if (!ballThrown || !sceneRef.current?.ball) return

    ballThrownRef.current = true
    console.log('🎳 Three.js 投球！', { aimAngle })

    const angleRad = (aimAngle * Math.PI) / 180
    const force = 200 // 降低力度，减少撞击强度
    const velocityScale = 0.018 // 稍微降低速度缩放因子

    // 设置球的速度
    sceneRef.current.ball.body.velocity.set(
      Math.sin(angleRad) * force * velocityScale * 0.3,
      0,
      -force * velocityScale
    )
    
    // 应用冲量
    const forceVector = new CANNON.Vec3(
      Math.sin(angleRad) * force * 0.2, // 降低侧向力
      -1, // 轻微向下的力
      -force * 0.5 // 降低前进力
    )
    sceneRef.current.ball.body.applyImpulse(forceVector, sceneRef.current.ball.body.position)
    
    // 重置投球计时器
    sceneRef.current.throwStartTime = Date.now()
    
    console.log('🎳 投球完成', { 
      force,
      angle: aimAngle,
      ballMass: sceneRef.current.ball.body.mass,
      velocitySet: {
        x: (Math.sin(angleRad) * force * velocityScale * 0.3).toFixed(3),
        z: (-force * velocityScale).toFixed(3)
      }
    })

  }, [ballThrown, aimAngle])

  // 重置球和球瓶位置
  useEffect(() => {
    if (!sceneRef.current || ballThrown) return

    // 重置球位置
    if (sceneRef.current.ball) {
      sceneRef.current.ball.body.position.set(0, 1, 10)
      sceneRef.current.ball.body.velocity.set(0, 0, 0)
      sceneRef.current.ball.body.angularVelocity.set(0, 0, 0)
      sceneRef.current.ball.mesh.position.set(0, 1, 10)
      sceneRef.current.ball.mesh.quaternion.set(0, 0, 0, 1)
    }
    
    // 重置相机和计时器
    if (sceneRef.current) {
      sceneRef.current.throwStartTime = undefined
      sceneRef.current.camera.position.set(CAMERA_CONFIG.INITIAL_POSITION.x, CAMERA_CONFIG.INITIAL_POSITION.y, CAMERA_CONFIG.INITIAL_POSITION.z)
      sceneRef.current.camera.lookAt(0, 0, 0)
    }

    // 重置球瓶位置
    sceneRef.current.pins.forEach((pin, index) => {
      const pos = PIN_POSITIONS[index]
      if (pos) {
        pin.body.position.set(pos[0], pos[1], pos[2])
        pin.body.velocity.set(0, 0, 0)
        pin.body.angularVelocity.set(0, 0, 0)
        pin.body.quaternion.set(0, 0, 0, 1)
      }
    })

  }, [canThrow, ballThrown])

  return (
    <div className="relative w-full h-[600px] bg-gradient-to-b from-sky-200 to-sky-100 rounded-lg overflow-hidden">
      <canvas 
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
      
      {/* 瞄准线 */}
      {canThrow && !ballThrown && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2" style={{ left: '61%' }}>
          <div 
            className="w-0.5 h-100 origin-bottom transition-transform duration-100"
            style={{ 
              transform: `translateX(-50%) rotate(${aimAngle}deg)`,
              transformOrigin: 'bottom center',
              background: 'repeating-linear-gradient(to top, #ef4444 0px, #ef4444 8px, transparent 8px, transparent 16px)'
            }}
          />
          <div className="text-center text-white text-sm mt-2 bg-black/50 px-2 py-1 rounded">
            角度: {aimAngle.toFixed(1)}°
          </div>
        </div>
      )}
    </div>
  )
} 