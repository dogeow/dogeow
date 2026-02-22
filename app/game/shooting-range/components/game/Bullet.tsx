import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface BulletProps {
  initialPosition: THREE.Vector3
  direction: THREE.Vector3
  onHit?: () => void
}

/**
 * 子弹组件
 * 包含飞行动画和拖尾效果
 */
export function Bullet({ initialPosition, direction }: BulletProps) {
  const bulletRef = useRef<THREE.Mesh>(null)
  const [position, setPosition] = useState(initialPosition)
  const [hit, setHit] = useState(false)
  const [lifetime, setLifetime] = useState(0)
  const [trailPositions, setTrailPositions] = useState<THREE.Vector3[]>([])
  const speed = 100 // 子弹速度

  // 初始化拖尾 - 使用useEffect同步外部Three.js系统

  useEffect(() => {
    // 创建拖尾点
    const points = []
    for (let i = 0; i < 10; i++) {
      points.push(initialPosition.clone())
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTrailPositions(points)
  }, [initialPosition])

  // 子弹飞行动画
  useFrame((_, delta) => {
    if (hit) return

    // 更新生存时间
    setLifetime(prev => prev + delta)

    // 2秒后自动销毁
    if (lifetime > 2) {
      setHit(true)
      return
    }

    if (bulletRef.current) {
      // 更新子弹位置
      const newPosition = position.clone().add(direction.clone().multiplyScalar(speed * delta))
      setPosition(newPosition)
      bulletRef.current.position.copy(newPosition)

      // 更新拖尾
      setTrailPositions(prev => {
        const newTrail = [...prev.slice(1), newPosition.clone()]
        return newTrail
      })
    }
  })

  const trailMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: '#ff8800',
        opacity: 0.6,
        transparent: true,
      }),
    []
  )

  // 如果子弹已击中，不渲染
  if (hit) return null

  return (
    <group>
      {/* 子弹主体 */}
      <mesh ref={bulletRef} position={position}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#ffaa00" emissive="#ff8800" emissiveIntensity={0.5} />
      </mesh>

      {/* 子弹拖尾 */}
      <group>
        {trailPositions.length > 1 && (
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array(trailPositions.flatMap(p => [p.x, p.y, p.z])), 3]}
                count={trailPositions.length}
                array={new Float32Array(trailPositions.flatMap(p => [p.x, p.y, p.z]))}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#ff8800" opacity={0.6} transparent />
          </line>
        )}
      </group>
    </group>
  )
}
