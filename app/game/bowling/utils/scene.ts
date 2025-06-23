import * as THREE from "three"
import * as CANNON from "cannon-es"
import { PHYSICS_CONFIG, PIN_POSITIONS } from "../config/constants"
import type { PhysicsMaterials, SceneElements, BallObject, PinObject } from "../types/scene"

// 创建场景元素（球道、地面等）
export function createSceneElements(
  scene: THREE.Scene, 
  world: CANNON.World, 
  materials: PhysicsMaterials
): SceneElements {
  const { groundMaterial } = materials

  // 创建一个视觉上的"坑底"地面，放置在较低位置
  const pitFloorGeometry = new THREE.PlaneGeometry(200, 200)
  const pitFloorMesh = new THREE.Mesh(
    pitFloorGeometry,
    new THREE.MeshPhongMaterial({ color: 0x2c2c54 })
  )
  pitFloorMesh.rotation.x = -Math.PI / 2
  pitFloorMesh.position.y = -10
  pitFloorMesh.receiveShadow = true
  scene.add(pitFloorMesh)

  // 创建有限长度的物理球道和视觉球道
  const laneLength = 32
  const laneWidth = PHYSICS_CONFIG.LANE_WIDTH

  // 视觉球道
  const laneMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xdeb887, 
    shininess: 80, 
    specular: 0x444444 
  })
  const laneGeometry = new THREE.PlaneGeometry(laneWidth, laneLength)
  const laneMesh = new THREE.Mesh(laneGeometry, laneMaterial)
  laneMesh.rotation.x = -Math.PI / 2
  laneMesh.position.set(0, 0.01, -6)
  laneMesh.receiveShadow = true
  scene.add(laneMesh)

  // 物理球道
  const laneShape = new CANNON.Box(new CANNON.Vec3(laneWidth / 2, 0.1, laneLength / 2))
  const laneBody = new CANNON.Body({ mass: 0, material: groundMaterial })
  laneBody.addShape(laneShape)
  laneBody.position.set(0, -0.1, -6)
  world.addBody(laneBody)

  // 添加投球助跑区
  const approachLength = 5
  const approachGeometry = new THREE.PlaneGeometry(laneWidth, approachLength)
  const approachMesh = new THREE.Mesh(approachGeometry, laneMaterial)
  approachMesh.rotation.x = -Math.PI / 2
  approachMesh.position.y = 0.01
  approachMesh.position.z = 10 + approachLength / 2
  approachMesh.receiveShadow = true
  scene.add(approachMesh)

  return { laneMesh, laneBody }
}

// 创建球
export function createBall(
  scene: THREE.Scene, 
  world: CANNON.World, 
  ballMaterial: CANNON.Material
): BallObject {
  const ballGeometry = new THREE.SphereGeometry(PHYSICS_CONFIG.BALL_RADIUS, 32, 32)
  const ballMesh = new THREE.Mesh(
    ballGeometry,
    new THREE.MeshPhongMaterial({ 
      color: 0xcc0000,
      shininess: 100,
      specular: 0x666666,
      emissive: 0x220000,
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
    linearDamping: 0.1,
    angularDamping: 0.05,
    fixedRotation: false,
    type: CANNON.Body.DYNAMIC
  })
  ballBody.addShape(ballShape)
  ballBody.position.set(0, 1, 10)
  world.addBody(ballBody)

  return { mesh: ballMesh, body: ballBody }
}

// 创建球瓶
export function createPins(
  scene: THREE.Scene, 
  world: CANNON.World, 
  pinMaterial: CANNON.Material
): PinObject[] {
  const pinHeight = PHYSICS_CONFIG.PIN_HEIGHT
  const pinPoints = [
    new THREE.Vector2(0, -pinHeight / 2),
    new THREE.Vector2(PHYSICS_CONFIG.PIN_RADIUS_BOTTOM, -pinHeight / 2),
    new THREE.Vector2(PHYSICS_CONFIG.PIN_RADIUS_BOTTOM * 1.2, -pinHeight * 0.4),
    new THREE.Vector2(PHYSICS_CONFIG.PIN_RADIUS_BOTTOM * 1.3, -pinHeight * 0.1),
    new THREE.Vector2(PHYSICS_CONFIG.PIN_RADIUS_TOP * 0.9, pinHeight * 0.4),
    new THREE.Vector2(PHYSICS_CONFIG.PIN_RADIUS_TOP, pinHeight / 2),
    new THREE.Vector2(0, pinHeight / 2),
  ]
  const pinGeometry = new THREE.LatheGeometry(pinPoints, 24)

  // 创建球瓶贴图
  const createPinTexture = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = '#e60028'
    const stripeHeight = canvas.height * 0.1
    const stripeY = canvas.height * 0.6
    ctx.fillRect(0, stripeY, canvas.width, stripeHeight)

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }

  const pinTexture = createPinTexture()
  const pinMaterial3D = new THREE.MeshPhongMaterial({
    map: pinTexture,
    shininess: 120,
    specular: 0x444444,
    emissive: 0x111111
  })
  
  const pins: PinObject[] = []

  PIN_POSITIONS.forEach((pos) => {
    const pinMesh = new THREE.Mesh(pinGeometry, pinMaterial3D)
    pinMesh.position.set(pos[0], pos[1], pos[2])
    pinMesh.castShadow = true
    pinMesh.receiveShadow = true
    scene.add(pinMesh)

    const pinShape = new CANNON.Cylinder(
      PHYSICS_CONFIG.PIN_RADIUS_TOP, 
      PHYSICS_CONFIG.PIN_RADIUS_BOTTOM, 
      PHYSICS_CONFIG.PIN_HEIGHT, 
      8
    )
    const pinBody = new CANNON.Body({ 
      mass: PHYSICS_CONFIG.PIN_MASS,
      material: pinMaterial,
      linearDamping: 0.2,
      angularDamping: 0.3
    })
    pinBody.addShape(pinShape)
    pinBody.position.set(pos[0], pos[1], pos[2])
    world.addBody(pinBody)

    pins.push({ mesh: pinMesh, body: pinBody })
  })

  return pins
}

// 创建边界墙
export function createWalls(scene: THREE.Scene, world: CANNON.World) {
  const wallLength = 37
  const wallPositionZ = -3.5
  const wallCenterX = PHYSICS_CONFIG.LANE_WIDTH / 2 + PHYSICS_CONFIG.GUTTER_WIDTH + PHYSICS_CONFIG.WALL_THICKNESS / 2

  const createWall = (x: number) => {
    const wallGeometry = new THREE.BoxGeometry(PHYSICS_CONFIG.WALL_THICKNESS, PHYSICS_CONFIG.WALL_HEIGHT, wallLength)
    const wallMesh = new THREE.Mesh(
      wallGeometry,
      new THREE.MeshLambertMaterial({ color: 0x666666 })
    )
    wallMesh.position.set(x, PHYSICS_CONFIG.WALL_HEIGHT / 2, wallPositionZ)
    scene.add(wallMesh)

    const wallShape = new CANNON.Box(new CANNON.Vec3(PHYSICS_CONFIG.WALL_THICKNESS / 2, PHYSICS_CONFIG.WALL_HEIGHT / 2, wallLength / 2))
    const wallBody = new CANNON.Body({ mass: 0 })
    wallBody.addShape(wallShape)
    wallBody.position.set(x, PHYSICS_CONFIG.WALL_HEIGHT / 2, wallPositionZ)
    world.addBody(wallBody)
  }

  createWall(-wallCenterX) // 左墙
  createWall(wallCenterX)  // 右墙

  // 创建视觉上的边沟
  const gutterGeometry = new THREE.BoxGeometry(PHYSICS_CONFIG.GUTTER_WIDTH, 0.1, wallLength)
  const gutterMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
  const gutterY = -0.05
  const gutterCenterX = PHYSICS_CONFIG.LANE_WIDTH / 2 + PHYSICS_CONFIG.GUTTER_WIDTH / 2

  const rightGutter = new THREE.Mesh(gutterGeometry, gutterMaterial)
  rightGutter.position.set(gutterCenterX, gutterY, wallPositionZ)
  scene.add(rightGutter)

  const leftGutter = new THREE.Mesh(gutterGeometry, gutterMaterial)
  leftGutter.position.set(-gutterCenterX, gutterY, wallPositionZ)
  scene.add(leftGutter)
}

// 添加照明
export function createLighting(scene: THREE.Scene) {
  // 使用半球光代替环境光
  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x2c2c54, 0.6)
  scene.add(hemisphereLight)

  // 主要方向光
  const mainLight = new THREE.DirectionalLight(0xffffff, 0.7)
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

  // 球道聚光灯
  const laneSpotLight = new THREE.SpotLight(0xffffff, 1.2)
  laneSpotLight.position.set(0, 12, 0)
  laneSpotLight.target.position.set(0, 0, -10)
  laneSpotLight.angle = Math.PI / 6
  laneSpotLight.penumbra = 0.3
  laneSpotLight.decay = 2
  laneSpotLight.distance = 30
  laneSpotLight.castShadow = true
  scene.add(laneSpotLight)

  // 球瓶区聚光灯
  const pinSpotLight = new THREE.SpotLight(0xffffff, 1.0)
  pinSpotLight.position.set(0, 10, -15)
  pinSpotLight.target.position.set(0, 0, -19)
  pinSpotLight.angle = Math.PI / 8
  pinSpotLight.penumbra = 0.2
  pinSpotLight.decay = 2
  pinSpotLight.distance = 20
  pinSpotLight.castShadow = true
  scene.add(pinSpotLight)

  // 侧面补光灯
  const sideLight1 = new THREE.DirectionalLight(0xffffff, 0.6)
  sideLight1.position.set(-10, 8, -10)
  sideLight1.target.position.set(0, 0, -15)
  scene.add(sideLight1)

  const sideLight2 = new THREE.DirectionalLight(0xffffff, 0.6)
  sideLight2.position.set(10, 8, -10)
  sideLight2.target.position.set(0, 0, -15)
  scene.add(sideLight2)

  // 背景点光源
  const backLight = new THREE.PointLight(0x444444, 0.5, 30)
  backLight.position.set(0, 5, -25)
  scene.add(backLight)
} 