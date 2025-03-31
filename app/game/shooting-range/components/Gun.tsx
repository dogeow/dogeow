import React from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

interface GunProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
}

export default function Gun(props: GunProps) {
  // 简单的枪支模型
  return (
    <group {...props}>
      {/* 枪身 */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.2, 0.2, 0.6]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      
      {/* 枪管 */}
      <mesh position={[0, 0, -0.4]}>
        <cylinderGeometry args={[0.05, 0.05, 0.5, 8]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
      
      {/* 握把 */}
      <mesh position={[0, -0.2, 0.1]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.15, 0.3, 0.15]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      
      {/* 瞄准器 */}
      <mesh position={[0, 0.15, -0.1]}>
        <boxGeometry args={[0.05, 0.05, 0.2]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
    </group>
  )
} 