import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ExplosionProps {
  position: [number, number, number]
  color: string
}

/**
 * 爆炸粒子效果组件
 */
export function Explosion({ position, color }: ExplosionProps) {
  // 创建随机爆炸粒子
  const particles = useMemo(() => {
    const temp = []
    const count = 15
    for (let i = 0; i < count; i++) {
      // 随机方向
      const direction = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize()

      // 随机速度
      const speed = Math.random() * 0.3 + 0.2

      // 随机尺寸
      const size = Math.random() * 0.2 + 0.1

      temp.push({
        direction,
        speed,
        size,
        offset: [
          Math.random() * 0.2 - 0.1,
          Math.random() * 0.2 - 0.1,
          Math.random() * 0.2 - 0.1,
        ] as [number, number, number],
      })
    }
    return temp
  }, [])

  // 粒子状态
  const particleRefs = useRef<THREE.Mesh[]>([])
  const [opacity, setOpacity] = useState(1)

  // 粒子动画
  useFrame((_, delta) => {
    particles.forEach((particle, i) => {
      const mesh = particleRefs.current[i]
      if (mesh) {
        // 移动粒子
        mesh.position.x += particle.direction.x * particle.speed * delta * 15
        mesh.position.y += particle.direction.y * particle.speed * delta * 15
        mesh.position.z += particle.direction.z * particle.speed * delta * 15
        // 缩小粒子
        mesh.scale.multiplyScalar(1 - delta * 1.5)
      }
    })

    // 降低透明度
    setOpacity(prev => Math.max(0, prev - delta * 2))
  })

  return (
    <group position={position}>
      {particles.map((particle, i) => (
        <mesh
          key={i}
          ref={el => {
            if (el) particleRefs.current[i] = el
          }}
          position={particle.offset}
        >
          <sphereGeometry args={[particle.size, 6, 6]} />
          <meshBasicMaterial color={color} transparent opacity={opacity} />
        </mesh>
      ))}
    </group>
  )
}
