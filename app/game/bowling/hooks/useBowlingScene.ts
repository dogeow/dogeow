import { useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { PHYSICS_CONFIG, CAMERA_CONFIG, PIN_POSITIONS } from '../config/constants'
import type { SceneRef } from '../types/scene'
import { createPhysicsMaterials } from '../utils/physics'
import {
  createSceneElements,
  createBall,
  createPins,
  createWalls,
  createLighting,
} from '../utils/scene'

export function useBowlingScene(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const sceneRef = useRef<SceneRef | null>(null)
  const isMounted = useRef(false)

  // 初始化场景
  const initializeScene = useCallback(() => {
    if (!canvasRef.current) return null

    const canvas = canvasRef.current
    const scene = new THREE.Scene()
    const bgColor = new THREE.Color(0x2c2c54)
    scene.background = bgColor
    scene.fog = new THREE.Fog(bgColor, 50, 90)

    // 相机设置
    const camera = new THREE.PerspectiveCamera(
      CAMERA_CONFIG.FOV,
      canvas.clientWidth / canvas.clientHeight,
      CAMERA_CONFIG.NEAR,
      CAMERA_CONFIG.FAR
    )
    camera.position.set(
      CAMERA_CONFIG.INITIAL_POSITION.x,
      CAMERA_CONFIG.INITIAL_POSITION.y,
      CAMERA_CONFIG.INITIAL_POSITION.z
    )
    camera.lookAt(0, 0, 0)

    // 渲染器设置
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    })
    renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2

    // 物理世界
    const world = new CANNON.World()
    world.gravity.set(0, PHYSICS_CONFIG.GRAVITY, 0)
    world.broadphase = new CANNON.NaiveBroadphase()
    world.allowSleep = false
    world.defaultContactMaterial.friction = 0.1
    world.defaultContactMaterial.restitution = 0.3

    // 创建场景元素
    const materials = createPhysicsMaterials(world)
    const { laneMesh, laneBody } = createSceneElements(scene, world, materials)
    const ball = createBall(scene, world, materials.ballMaterial)
    const pins = createPins(scene, world, materials.pinMaterial)

    createWalls(scene, world)
    createLighting(scene)

    return {
      scene,
      camera,
      renderer,
      world,
      ball,
      pins,
      lane: { mesh: laneMesh, body: laneBody },
      animationId: null,
      materials,
    } as SceneRef
  }, [canvasRef])

  // 重置球的位置和状态
  const resetBall = useCallback(() => {
    if (!sceneRef.current?.ball) return

    const { ball } = sceneRef.current
    ball.body.position.set(0, 1, 10)
    ball.body.velocity.set(0, 0, 0)
    ball.body.angularVelocity.set(0, 0, 0)
    ball.body.quaternion.set(0, 0, 0, 1)
  }, [])

  // 重置所有球瓶的位置和状态
  const resetPins = useCallback(() => {
    if (!sceneRef.current?.pins) return

    sceneRef.current.pins.forEach((pin, index) => {
      const initialPos = PIN_POSITIONS[index]
      pin.body.position.set(initialPos[0], initialPos[1], initialPos[2])
      pin.body.velocity.set(0, 0, 0)
      pin.body.angularVelocity.set(0, 0, 0)
      pin.body.quaternion.set(0, 0, 0, 1)
    })
  }, [])

  // 完全重置场景（新一轮）
  const resetScene = useCallback(() => {
    resetBall()
    resetPins()
    console.log('✅ 场景已完全重置')
  }, [resetBall, resetPins])

  // 处理窗口大小变化
  const handleResize = useCallback(() => {
    if (!sceneRef.current || !canvasRef.current) return

    const width = canvasRef.current.clientWidth
    const height = canvasRef.current.clientHeight

    sceneRef.current.camera.aspect = width / height
    sceneRef.current.camera.updateProjectionMatrix()
    sceneRef.current.renderer.setSize(width, height)
  }, [canvasRef])

  // 投球逻辑
  const throwBall = useCallback((aimAngle: number, power: number) => {
    if (!sceneRef.current?.ball) return

    const angleRad = (aimAngle * Math.PI) / 180
    const basePower = 300
    const powerMultiplier = power / 100
    const force = basePower * powerMultiplier
    const velocityScale = 0.03

    // 设置球的速度
    sceneRef.current.ball.body.velocity.set(
      Math.sin(angleRad) * force * velocityScale * 0.3,
      0,
      -force * velocityScale
    )

    // 应用冲量
    const forceVector = new CANNON.Vec3(Math.sin(angleRad) * force * 0.2, -3, -force * 1.0)
    sceneRef.current.ball.body.applyImpulse(forceVector, sceneRef.current.ball.body.position)

    // 设置投球开始时间
    sceneRef.current.throwStartTime = Date.now()

    console.log('🎳 投球完成', { power, force, angle: aimAngle })
  }, [])

  // 计算击倒的球瓶数量
  const calculateKnockedDownPins = useCallback((): number => {
    if (!sceneRef.current?.pins) return 0

    let knockedDownCount = 0
    sceneRef.current.pins.forEach(pin => {
      const rotation = pin.body.quaternion
      const position = pin.body.position
      const rotationMatrix = new THREE.Matrix4().makeRotationFromQuaternion(
        new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w)
      )
      const upVector = new THREE.Vector3(0, 1, 0).applyMatrix4(rotationMatrix)
      const tiltAngle = Math.acos(Math.abs(upVector.y))
      const isKnockedDown = tiltAngle > 0.785 || position.y < 0.3

      if (isKnockedDown) {
        knockedDownCount++
      }
    })

    return knockedDownCount
  }, [])

  // 初始化场景
  useEffect(() => {
    const scene = initializeScene()
    if (scene) {
      sceneRef.current = scene
      isMounted.current = true

      // 添加窗口大小变化监听
      window.addEventListener('resize', handleResize)
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      if (sceneRef.current?.animationId) {
        cancelAnimationFrame(sceneRef.current.animationId)
      }
      sceneRef.current?.renderer.dispose()
    }
  }, [initializeScene, handleResize])

  return {
    sceneRef,
    isMounted,
    resetBall,
    resetPins,
    resetScene,
    throwBall,
    calculateKnockedDownPins,
  }
}
