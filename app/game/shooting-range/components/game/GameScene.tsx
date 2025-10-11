import { useEffect, useState, useCallback, useRef, useMemo, Suspense } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { PointerLockControls, Environment } from '@react-three/drei'
import { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { Target } from './Target'
import { Bullet } from './Bullet'
import { FPSWeapon } from './FPSWeapon'
import { Explosion } from './Explosion'
import {
  difficultySettings,
  generateRandomPosition,
  generateRandomDirection,
} from '../../utils/gameUtils'
import { playShotSound, playHitSound } from '../../utils/audioUtils'

interface TargetData {
  id: number
  position: [number, number, number]
  hit: boolean
  scale: number
  speed: number
  direction: [number, number, number]
}

interface BulletData {
  id: number
  position: THREE.Vector3
  direction: THREE.Vector3
}

interface ExplosionData {
  id: number
  position: [number, number, number]
  color: string
}

interface GameSceneProps {
  difficulty: 'easy' | 'medium' | 'hard'
  onScore: () => void
  gameStarted: boolean
  setGameStarted: (started: boolean) => void
  useFallbackControls?: boolean
  onError?: (message: string) => void
}

/**
 * 游戏场景组件
 * 包含所有3D元素和游戏逻辑
 */
export function GameScene({
  difficulty,
  onScore,
  gameStarted,
  setGameStarted,
  useFallbackControls = false,
  onError = () => {},
}: GameSceneProps) {
  const { camera, gl, scene } = useThree()
  const controls = useRef<PointerLockControlsImpl | null>(null)
  const [targets, setTargets] = useState<TargetData[]>([])

  // 子弹状态
  const [bullets, setBullets] = useState<BulletData[]>([])
  const bulletCounter = useRef(0)

  // 射击冷却控制
  const [canShoot, setCanShoot] = useState(true)
  const shootCooldown = useRef(500)

  // 指针锁状态
  const [, setPointerLocked] = useState(false)

  // 根据难度设置参数
  const settings = difficultySettings[difficulty]

  // 爆炸效果
  const [explosions, setExplosions] = useState<ExplosionData[]>([])

  const startExplosion = useCallback(
    (position: [number, number, number], color: string = '#ff4444') => {
      const explosionId = Date.now() + Math.random()
      setExplosions(prev => [...prev, { id: explosionId, position, color }])

      // 2秒后移除爆炸效果
      setTimeout(() => {
        setExplosions(prev => prev.filter(exp => exp.id !== explosionId))
      }, 2000)
    },
    []
  )

  // 初始化目标
  useEffect(() => {
    const newTargets: TargetData[] = []

    for (let i = 0; i < settings.targetCount; i++) {
      const position = generateRandomPosition(settings.gameAreaSize)
      const direction = generateRandomDirection()

      newTargets.push({
        id: i,
        position,
        hit: false,
        scale: Math.random() * 0.3 + 0.5,
        speed: Math.random() * 0.01 + settings.targetSpeed,
        direction,
      })
    }

    setTargets(newTargets)
  }, [settings.gameAreaSize, settings.targetCount, settings.targetSpeed])

  // 处理击中目标
  const handleTargetHit = useCallback(
    (id: number) => {
      console.log('击中目标:', id)

      // 播放击中音效
      playHitSound()

      // 添加震动反馈（如果浏览器支持）
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }

      // 立即更新目标状态
      setTargets(prev => prev.map(target => (target.id === id ? { ...target, hit: true } : target)))

      onScore()

      // 2秒后重生目标
      setTimeout(() => {
        setTargets(prev =>
          prev.map(target => {
            if (target.id === id) {
              const position = generateRandomPosition(settings.gameAreaSize)
              const direction = generateRandomDirection()

              return {
                ...target,
                position,
                hit: false,
                direction,
              }
            }
            return target
          })
        )
      }, 2000)
    },
    [onScore, settings.gameAreaSize]
  )

  // 每帧更新目标位置
  useFrame((_, delta) => {
    if (!gameStarted) return

    setTargets(prev =>
      prev.map(target => {
        if (target.hit) return target

        const gameArea = settings.gameAreaSize
        let [x, y, z] = target.position
        const [dx, dy, dz] = target.direction

        // 移动目标
        x += dx * target.speed * 60 * delta
        y += dy * target.speed * 60 * delta
        z += dz * target.speed * 60 * delta

        // 边界检查和反弹
        let newDx = dx
        let newDy = dy
        let newDz = dz

        const halfArea = gameArea / 2

        // 增加随机改变方向的概率
        const shouldChangeDirection = Math.random() < 0.02

        if (x < -halfArea || x > halfArea) {
          newDx = -dx
          if (Math.random() < 0.5) {
            newDy = (Math.random() - 0.5) * 2
            newDz = (Math.random() - 0.5) * 2
          }
        }
        if (y < -halfArea / 2 || y > halfArea / 2 + 5) {
          newDy = -dy
          if (Math.random() < 0.5) {
            newDx = (Math.random() - 0.5) * 2
            newDz = (Math.random() - 0.5) * 2
          }
        }
        if (z < -halfArea - 5 || z > halfArea - 5) {
          newDz = -dz
          if (Math.random() < 0.5) {
            newDx = (Math.random() - 0.5) * 2
            newDy = (Math.random() - 0.5) * 2
          }
        }

        // 随机改变方向
        if (shouldChangeDirection) {
          newDx = (Math.random() - 0.5) * 2
          newDy = (Math.random() - 0.5) * 2
          newDz = (Math.random() - 0.5) * 2
        }

        // 归一化方向向量
        const length = Math.sqrt(newDx ** 2 + newDy ** 2 + newDz ** 2)
        newDx /= length
        newDy /= length
        newDz /= length

        return {
          ...target,
          position: [x, y, z] as [number, number, number],
          direction: [newDx, newDy, newDz] as [number, number, number],
        }
      })
    )
  })

  // 枪口闪光效果
  const [muzzleFlash, setMuzzleFlash] = useState(false)

  // 显示射击反馈
  const showMuzzleFlash = useCallback(() => {
    setMuzzleFlash(true)
    setTimeout(() => setMuzzleFlash(false), 100)
  }, [])

  // 处理子弹碰撞检测
  const checkBulletCollisions = useCallback(() => {
    setBullets(prevBullets => {
      return prevBullets.filter(bullet => {
        const raycaster = new THREE.Raycaster(
          bullet.position.clone(),
          bullet.direction.clone(),
          0,
          2
        )

        const hitTargets: { id: number; distance: number }[] = []

        targets.forEach(target => {
          if (!target.hit) {
            const sphere = new THREE.Sphere(
              new THREE.Vector3(...target.position),
              target.scale * 1.2
            )

            const intersectionPoint = new THREE.Vector3()
            if (raycaster.ray.intersectSphere(sphere, intersectionPoint)) {
              const distance = intersectionPoint.distanceTo(bullet.position)
              hitTargets.push({ id: target.id, distance })
            }
          }
        })

        if (hitTargets.length > 0) {
          hitTargets.sort((a, b) => a.distance - b.distance)
          handleTargetHit(hitTargets[0].id)
          return false
        }

        return true
      })
    })
  }, [targets, handleTargetHit])

  // 每帧更新子弹碰撞
  useFrame(() => {
    if (gameStarted && bullets.length > 0) {
      checkBulletCollisions()
    }
  })

  // 处理普通模式下的射击
  const handleShoot = useCallback(() => {
    if (!gameStarted || !canShoot) return

    setCanShoot(false)
    setTimeout(() => {
      setCanShoot(true)
    }, shootCooldown.current)

    showMuzzleFlash()

    const raycaster = new THREE.Raycaster()
    const exactCenter = new THREE.Vector2(0, 0)
    raycaster.setFromCamera(exactCenter, camera)

    const bulletDirection = raycaster.ray.direction.clone()
    const bulletPosition = camera.position.clone()
    bulletPosition.add(bulletDirection.clone().multiplyScalar(0.1))

    setBullets(prev => [
      ...prev,
      {
        id: bulletCounter.current++,
        position: bulletPosition,
        direction: bulletDirection,
      },
    ])

    if (bullets.length > 20) {
      setBullets(prev => prev.slice(prev.length - 20))
    }

    playShotSound()

    const hittableTargets: { targetId: number; distance: number; point: THREE.Vector3 }[] = []

    targets.forEach(target => {
      if (!target.hit) {
        const sphere = new THREE.Sphere(new THREE.Vector3(...target.position), target.scale * 1.2)

        const intersectPoint = new THREE.Vector3()
        const didIntersect = raycaster.ray.intersectSphere(sphere, intersectPoint)

        if (didIntersect) {
          const distance = intersectPoint.distanceTo(camera.position)
          hittableTargets.push({
            targetId: target.id,
            distance: distance,
            point: intersectPoint.clone(),
          })
        }
      }
    })

    if (hittableTargets.length === 0) {
      const targetMeshes: THREE.Object3D[] = []
      scene.traverse(object => {
        if (
          object instanceof THREE.Mesh &&
          object.userData &&
          object.userData.isTarget &&
          !object.userData.hit
        ) {
          targetMeshes.push(object)
        }
      })

      const intersects = raycaster.intersectObjects(targetMeshes, true)

      for (const intersect of intersects) {
        let targetObject: THREE.Object3D | null = intersect.object

        while (targetObject && !targetObject.userData?.targetId) {
          targetObject = targetObject.parent
        }

        if (targetObject && targetObject.userData?.targetId !== undefined) {
          hittableTargets.push({
            targetId: targetObject.userData.targetId,
            distance: intersect.distance,
            point: intersect.point.clone(),
          })
        }
      }
    }

    if (hittableTargets.length > 0) {
      hittableTargets.sort((a, b) => a.distance - b.distance)
      const hitResult = hittableTargets[0]
      handleTargetHit(hitResult.targetId)
    }
  }, [
    camera,
    gameStarted,
    scene,
    handleTargetHit,
    showMuzzleFlash,
    targets,
    bullets.length,
    bulletCounter,
    canShoot,
    shootCooldown,
  ])

  // 监听鼠标点击事件
  useEffect(() => {
    if (useFallbackControls || !gameStarted) return

    const handleClick = () => {
      handleShoot()
    }

    window.addEventListener('click', handleClick)
    window.addEventListener('mousedown', handleClick)

    return () => {
      window.removeEventListener('click', handleClick)
      window.removeEventListener('mousedown', handleClick)
    }
  }, [gameStarted, handleShoot, useFallbackControls])

  // 添加键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && gameStarted && !useFallbackControls) {
        e.preventDefault()
        handleShoot()
      }
    }

    window.addEventListener('keydown', handleKeyDown, { passive: false })
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameStarted, handleShoot, useFallbackControls])

  // 使用effect来检测gameStarted状态的变化
  useEffect(() => {
    let pointerLockErrorReported = false

    if (gameStarted && !useFallbackControls && controls.current) {
      try {
        const timeoutId = setTimeout(() => {
          try {
            if (controls.current && typeof controls.current.lock === 'function') {
              controls.current.lock()
            }
          } catch (error) {
            if (!pointerLockErrorReported) {
              console.error('锁定指针失败:', error)
              onError('无法锁定鼠标指针，请尝试使用备用控制模式')
              pointerLockErrorReported = true
            }
          }
        }, 300)

        return () => clearTimeout(timeoutId)
      } catch (error) {
        if (!pointerLockErrorReported) {
          console.error('请求动画帧失败:', error)
          onError('无法锁定鼠标指针，请尝试使用备用控制模式')
          pointerLockErrorReported = true
        }
      }
    }

    const handlePointerLockChange = () => {
      const isLocked =
        document.pointerLockElement === gl.domElement ||
        (document as Document & { mozPointerLockElement?: Element }).mozPointerLockElement ===
          gl.domElement ||
        (document as Document & { webkitPointerLockElement?: Element }).webkitPointerLockElement ===
          gl.domElement

      setPointerLocked(isLocked)

      if (gameStarted && !isLocked) {
        console.log('指针锁定已退出，更新游戏状态')
        setGameStarted(false)
      }
    }

    const handleBeforeUnload = () => {
      if (document.exitPointerLock) {
        document.exitPointerLock()
      }
    }

    document.addEventListener('pointerlockchange', handlePointerLockChange)
    document.addEventListener('mozpointerlockchange', handlePointerLockChange)
    document.addEventListener('webkitpointerlockchange', handlePointerLockChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      try {
        if (
          document.pointerLockElement ||
          (document as Document & { mozPointerLockElement?: Element }).mozPointerLockElement ||
          (document as Document & { webkitPointerLockElement?: Element }).webkitPointerLockElement
        ) {
          if (document.exitPointerLock) {
            document.exitPointerLock()
          } else if (
            (document as Document & { mozExitPointerLock?: () => void }).mozExitPointerLock
          ) {
            ;(document as Document & { mozExitPointerLock?: () => void }).mozExitPointerLock?.()
          } else if (
            (document as Document & { webkitExitPointerLock?: () => void }).webkitExitPointerLock
          ) {
            ;(
              document as Document & { webkitExitPointerLock?: () => void }
            ).webkitExitPointerLock?.()
          }
        }
      } catch (e) {
        console.error('释放指针锁出错:', e)
      }

      document.removeEventListener('pointerlockchange', handlePointerLockChange)
      document.removeEventListener('mozpointerlockchange', handlePointerLockChange)
      document.removeEventListener('webkitpointerlockchange', handlePointerLockChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [gameStarted, useFallbackControls, onError, gl, setGameStarted, startExplosion])

  return (
    <>
      {!useFallbackControls && (
        <Suspense fallback={null}>
          {gameStarted ? <PointerLockControls ref={controls} /> : null}
        </Suspense>
      )}

      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

      <Environment preset="sunset" />
      <fog attach="fog" args={['#0c1445', 15, 50]} />

      {/* 太阳 */}
      <mesh position={[0, 15, -40]} rotation={[0, 0, 0]}>
        <circleGeometry args={[10, 32]} />
        <meshStandardMaterial
          color="#ff3300"
          emissive="#ff3300"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>

      <pointLight
        position={[0, 15, -40]}
        color="#ff5500"
        intensity={10}
        distance={200}
        decay={0.5}
      />

      <directionalLight
        position={[0, 100, -100]}
        intensity={1}
        color="#fffbe0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={250}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />

      {/* 地面 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#1a2b4a" />
      </mesh>

      {/* 星星 */}
      {useMemo(() => {
        const stars = []
        for (let i = 0; i < 50; i++) {
          const x = (Math.random() - 0.5) * 180
          const y = Math.random() * 40 + 10
          const z = (Math.random() - 0.5) * 180
          const size = Math.random() * 0.15 + 0.05
          stars.push(
            <mesh key={i} position={[x, y, z]}>
              <sphereGeometry args={[size, 4, 4]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
            </mesh>
          )
        }
        return stars
      }, [])}

      {/* 目标 */}
      {targets.map(target => (
        <Target
          key={target.id}
          id={target.id}
          position={target.position}
          hit={target.hit}
          scale={target.scale}
          onClick={() => handleTargetHit(target.id)}
        />
      ))}

      {/* 子弹 */}
      {bullets.map(bullet => (
        <Bullet key={bullet.id} initialPosition={bullet.position} direction={bullet.direction} />
      ))}

      {/* 武器 */}
      <Suspense fallback={null}>
        <FPSWeapon muzzleFlash={muzzleFlash} />
      </Suspense>

      {/* 爆炸效果 */}
      {explosions.map(explosion => (
        <Explosion key={explosion.id} position={explosion.position} color={explosion.color} />
      ))}
    </>
  )
}
