import { useRef, useCallback, useEffect } from "react"
import * as THREE from "three"
import * as CANNON from "cannon-es"
import { PHYSICS_CONFIG, CAMERA_CONFIG } from "../config/constants"
import type { SceneRef } from "../types/scene"
import { checkSceneIsStable } from "../utils/physics"

interface UseAnimationProps {
  sceneRef: React.RefObject<SceneRef | null>
  showingResult: boolean
  ballThrownRef: React.RefObject<boolean>
  isProcessingResultRef: React.RefObject<boolean>
  onResultProcessed: () => void
}

export function useBowlingAnimation({
  sceneRef,
  showingResult,
  ballThrownRef,
  isProcessingResultRef,
  onResultProcessed
}: UseAnimationProps) {
  const animationIdRef = useRef<number | null>(null)

  // 更新相机位置
  const updateCamera = useCallback((camera: THREE.PerspectiveCamera, ballPosition: CANNON.Vec3) => {
    if (showingResult) return

    // 如果球还没投出，将相机锁定在初始玩家视角
    if (!ballThrownRef.current) {
      camera.position.set(
        CAMERA_CONFIG.INITIAL_POSITION.x,
        CAMERA_CONFIG.INITIAL_POSITION.y,
        CAMERA_CONFIG.INITIAL_POSITION.z
      )
      camera.lookAt(0, 1, -20)
      return
    }

    // 球投出后的跟随逻辑
    const PIN_AREA_END_Z = -22
    const effectiveBallZ = Math.max(ballPosition.z, PIN_AREA_END_Z)
    const effectiveBallY = Math.max(ballPosition.y, 0)

    let targetZ = effectiveBallZ < 0 ? effectiveBallZ + 15 : CAMERA_CONFIG.INITIAL_POSITION.z
    targetZ = Math.max(targetZ, -8)

    const targetPosition = new THREE.Vector3(
      CAMERA_CONFIG.INITIAL_POSITION.x,
      CAMERA_CONFIG.FOLLOW_HEIGHT,
      targetZ
    )

    camera.position.lerp(targetPosition, CAMERA_CONFIG.SLOW_LERP_SPEED)
    camera.lookAt(0, effectiveBallY, effectiveBallZ)
  }, [showingResult, ballThrownRef])

  // 动画循环
  const startAnimation = useCallback(() => {
    if (!sceneRef.current) return
    const { renderer, scene, camera, world } = sceneRef.current

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

      // 检查场景是否稳定
      if (
        !isProcessingResultRef.current &&
        ballThrownRef.current &&
        !showingResult &&
        sceneRef.current.ball &&
        sceneRef.current.pins &&
        sceneRef.current.throwStartTime
      ) {
        const ballPos = sceneRef.current.ball.body.position
        const ballVel = sceneRef.current.ball.body.velocity
        const elapsedTime = Date.now() - sceneRef.current.throwStartTime
        
        // 每5秒输出一次球的状态用于调试
        if (elapsedTime % 5000 < 50) {
          console.log(`🎳 球状态: 位置(${ballPos.x.toFixed(1)}, ${ballPos.y.toFixed(1)}, ${ballPos.z.toFixed(1)}) 速度(${ballVel.length().toFixed(2)}) 时间(${(elapsedTime/1000).toFixed(1)}s)`)
        }
        
        if (checkSceneIsStable(
          sceneRef.current.ball.body,
          sceneRef.current.pins.map(p => p.body),
          sceneRef.current.throwStartTime
        )) {
          isProcessingResultRef.current = true
          
          console.log('🎳 场景稳定，等待1秒后处理结果...')
          setTimeout(() => {
            onResultProcessed()
          }, 1000)
        }
      }

      renderer.render(scene, camera)
      animationIdRef.current = requestAnimationFrame(animate)
    }

    // 停止任何可能正在运行的旧动画循环
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current)
    }
    
    // 开始新的动画循环
    animate()
  }, [sceneRef, updateCamera, isProcessingResultRef, onResultProcessed])

  // 停止动画
  const stopAnimation = useCallback(() => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current)
      animationIdRef.current = null
    }
  }, [])

  // 当场景准备好时启动动画
  useEffect(() => {
    if (sceneRef.current) {
      startAnimation()
    }
    
    return () => {
      stopAnimation()
    }
  }, [sceneRef.current, startAnimation, stopAnimation])

  return {
    startAnimation,
    stopAnimation
  }
} 