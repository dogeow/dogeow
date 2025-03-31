import React, { useState, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface TargetProps {
  id: number;
  position: [number, number, number];
  hit: boolean;
  scale: number;
  onClick?: () => void;
}

export default function Target({ id, position, hit, scale, onClick }: TargetProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [exploding, setExploding] = useState(false)
  const [particles, setParticles] = useState<{ 
    position: [number, number, number]; 
    velocity: [number, number, number];
    size: number;
    color: string;
  }[]>([])
  
  // 处理爆炸效果
  useEffect(() => {
    if (hit && !exploding) {
      setExploding(true)
      
      // 创建爆炸粒子
      const newParticles = []
      const particleCount = 20
      
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = Math.random() * 0.05 + 0.02
        
        newParticles.push({
          position: [...position] as [number, number, number],
          velocity: [
            Math.cos(angle) * speed,
            (Math.random() - 0.5) * 0.1 + 0.05, // 向上飞一点
            Math.sin(angle) * speed
          ] as [number, number, number],
          size: Math.random() * 0.2 + 0.1,
          color: ['#ff8800', '#ffaa00', '#ff5500', '#ff2200'][Math.floor(Math.random() * 4)]
        })
      }
      
      setParticles(newParticles)
    }
  }, [hit, position, exploding])
  
  // 更新粒子位置
  useFrame((_, delta) => {
    if (exploding) {
      setParticles(prev => 
        prev.map(particle => {
          // 更新粒子位置
          const newPos: [number, number, number] = [
            particle.position[0] + particle.velocity[0] * 60 * delta,
            particle.position[1] + particle.velocity[1] * 60 * delta - 0.01 * 60 * delta, // 添加重力效果
            particle.position[2] + particle.velocity[2] * 60 * delta
          ]
          
          // 更新速度（减慢）
          const newVel: [number, number, number] = [
            particle.velocity[0] * 0.95,
            particle.velocity[1] * 0.95,
            particle.velocity[2] * 0.95
          ]
          
          return {
            ...particle,
            position: newPos,
            velocity: newVel
          }
        })
      )
    }
  })
  
  // 将对象加入场景并添加userData属性
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.userData = {
        isTarget: true,
        targetId: id,
        hit
      }
    }
  }, [id, hit])
  
  // 旋转动画
  useFrame((_, delta) => {
    if (meshRef.current && !hit) {
      meshRef.current.rotation.y += delta * 0.5
    }
  })
  
  return (
    <>
      {/* 目标球体 - 未击中状态 */}
      {!hit && (
        <mesh 
          ref={meshRef}
          position={position}
          scale={scale}
          onClick={onClick}
        >
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#5599ff" emissive="#3366cc" emissiveIntensity={0.5} />
        </mesh>
      )}
      
      {/* 爆炸粒子 */}
      {exploding && particles.map((particle, i) => (
        <mesh 
          key={i} 
          position={particle.position}
          scale={particle.size}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial 
            color={particle.color} 
            emissive={particle.color} 
            emissiveIntensity={1}
          />
        </mesh>
      ))}
    </>
  )
} 