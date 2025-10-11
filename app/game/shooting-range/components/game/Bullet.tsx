import { useRef, useState, useEffect } from 'react'
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
  const speed = 100 // 子弹速度

  // 创建拖尾效果
  const trailPositions = useRef<THREE.Vector3[]>([])
  const trailMaterial = useRef(
    new THREE.LineBasicMaterial({
      color: '#ff8800',
      opacity: 0.6,
      transparent: true,
    })
  )

  // 初始化拖尾
  useEffect(() => {
    // 创建拖尾点
    const points = []
    for (let i = 0; i < 10; i++) {
      points.push(initialPosition.clone())
    }
    trailPositions.current = points
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
      trailPositions.current.shift()
      trailPositions.current.push(newPosition.clone())
    }
  })

  return hit ? null : (
    <>
      {/* 子弹 */}
      <mesh ref={bulletRef} position={position}>
        <capsuleGeometry args={[0.03, 0.15, 4, 8]} />
        <meshStandardMaterial color="#ffff00" emissive="#ff8800" emissiveIntensity={0.5} />
      </mesh>

      {/* 子弹拖尾 */}
      <group>
        {trailPositions.current && trailPositions.current.length > 1 && (
          <line>
            <bufferGeometry
              attach="geometry"
              onUpdate={self => {
                const positions = []
                for (const pos of trailPositions.current) {
                  positions.push(pos.x, pos.y, pos.z)
                }
                self.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
              }}
            />
            <primitive object={trailMaterial.current} attach="material" />
          </line>
        )}
      </group>

      {/* 子弹光效 */}
      <pointLight position={position} color="#ff8800" intensity={0.5} distance={2} decay={1} />
    </>
  )
}
