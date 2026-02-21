import { useRef, useState, useLayoutEffect, useEffect, Suspense } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { Explosion } from './Explosion'
import { playExplosionSound } from '../../utils/audioUtils'

interface TargetProps {
  position: [number, number, number]
  hit: boolean
  scale: number
  onClick: () => void
  id?: number
}

/**
 * 目标组件
 * 包含击中效果、动画和爆炸效果
 */
export function Target({ position, hit, scale, onClick, id }: TargetProps) {
  const mesh = useRef<THREE.Mesh>(null)
  const [startExplosion, setStartExplosion] = useState(false)
  const [destroyed, setDestroyed] = useState(false)

  // 使用 ref 跟踪爆炸状态以避免在 effect 中设置 state
  const explosionTriggeredRef = useRef(false)

  // 目标的材质 - 修改为useState以确保状态变化时能够重新渲染
  const [targetMaterial, setTargetMaterial] = useState(
    () =>
      new THREE.MeshStandardMaterial({
        color: hit ? '#ff0000' : '#00aaff',
        emissive: hit ? '#550000' : '#004488',
        roughness: 0.2,
        metalness: 0.8,
      })
  )

  // 当hit状态改变时更新材质和触发爆炸

  // Using useLayoutEffect to sync with Three.js external system
  useLayoutEffect(() => {
    if (hit && !explosionTriggeredRef.current) {
      explosionTriggeredRef.current = true
      setStartExplosion(true)

      // 设置目标为红色表示被击中
      setTargetMaterial(
        new THREE.MeshStandardMaterial({
          color: '#ff0000',
          emissive: '#550000',
          roughness: 0.2,
          metalness: 0.8,
        })
      )

      // 播放爆炸音效
      playExplosionSound()

      // 0.2秒后开始消失动画
      const timer = setTimeout(() => {
        setDestroyed(true)
      }, 200)

      return () => clearTimeout(timer)
    } else if (!hit) {
      explosionTriggeredRef.current = false
      setStartExplosion(false)
      setDestroyed(false)
      setTargetMaterial(
        new THREE.MeshStandardMaterial({
          color: '#00aaff',
          emissive: '#004488',
          roughness: 0.2,
          metalness: 0.8,
        })
      )
    }
  }, [hit])

  // 为mesh添加id信息，方便射线检测
  useEffect(() => {
    if (mesh.current && id !== undefined) {
      mesh.current.userData.targetId = id
      mesh.current.userData.isTarget = true
      mesh.current.userData.hit = hit
    }
  }, [id, hit])

  // 使用useFrame添加轻微的动画效果
  useFrame((_, delta) => {
    if (mesh.current && !hit) {
      // 轻微的脉动效果
      mesh.current.scale.x = scale * (1 + Math.sin(Date.now() * 0.003) * 0.05)
      mesh.current.scale.y = scale * (1 + Math.sin(Date.now() * 0.003) * 0.05)
      mesh.current.scale.z = scale * (1 + Math.sin(Date.now() * 0.003) * 0.05)
    } else if (mesh.current && hit && !destroyed) {
      // 被击中后急速膨胀效果
      mesh.current.scale.x += delta * 2
      mesh.current.scale.y += delta * 2
      mesh.current.scale.z += delta * 2
    } else if (mesh.current && destroyed) {
      // 被击中后快速缩小至消失
      mesh.current.scale.x = Math.max(0.001, mesh.current.scale.x - delta * 6)
      mesh.current.scale.y = Math.max(0.001, mesh.current.scale.y - delta * 6)
      mesh.current.scale.z = Math.max(0.001, mesh.current.scale.z - delta * 6)
    }
  })

  // 直接在组件内处理点击事件
  const handleMeshClick = (e: ThreeEvent<MouseEvent>) => {
    // React Three Fiber 事件处理
    if (e.stopPropagation) {
      e.stopPropagation()
    }

    console.log(`直接点击了目标 ${id}`)
    if (!hit) {
      onClick()
    }
  }

  return (
    <>
      <mesh
        ref={mesh}
        position={position}
        scale={[scale, scale, scale]}
        onClick={handleMeshClick}
        castShadow
        receiveShadow
        visible={!destroyed}
        userData={{ targetId: id, isTarget: true, hit: hit }}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <primitive object={targetMaterial} attach="material" />

        {/* 击中特效 */}
        {hit && !destroyed && (
          <Suspense fallback={null}>
            <pointLight intensity={3} distance={5} color="#ff0000" />
            <mesh scale={[1.2, 1.2, 1.2]}>
              <sphereGeometry args={[1, 8, 8]} />
              <meshBasicMaterial color="#ff6600" transparent opacity={0.6} />
            </mesh>
          </Suspense>
        )}
      </mesh>

      {/* 爆炸效果 */}
      {startExplosion && (
        <Suspense fallback={null}>
          <Explosion position={position} color="#ff6600" />
          <pointLight position={position} intensity={5} distance={8} decay={2} color="#ff8800" />
        </Suspense>
      )}
    </>
  )
}
