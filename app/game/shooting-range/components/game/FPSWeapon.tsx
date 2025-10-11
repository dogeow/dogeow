import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { GunModel } from './GunModel'

interface FPSWeaponProps {
  muzzleFlash: boolean
}

/**
 * 第一人称武器组件
 * 跟随相机移动，带枪口闪光效果
 */
export function FPSWeapon({ muzzleFlash }: FPSWeaponProps) {
  const { camera } = useThree()
  const gunRef = useRef<THREE.Group>(null)

  // 使用useFrame使枪支跟随相机旋转
  useFrame(() => {
    if (gunRef.current) {
      // 基础位置偏移，基于相机的局部坐标系
      const offsetPosition = new THREE.Vector3(0.15, -0.1, -0.3)

      // 获取相机的位置和旋转
      const cameraPosition = camera.position.clone()
      const cameraQuaternion = camera.quaternion.clone()

      // 创建一个局部位置向量，将偏移应用到相机局部空间
      const localPosition = offsetPosition.clone()

      // 将局部位置向量应用相机的旋转，得到世界空间中的位置
      localPosition.applyQuaternion(cameraQuaternion)

      // 计算最终位置（相机位置+旋转后的局部位置）
      const finalPosition = cameraPosition.clone().add(localPosition)

      // 应用位置
      gunRef.current.position.copy(finalPosition)

      // 完全跟随相机旋转
      gunRef.current.quaternion.copy(cameraQuaternion)

      // 添加轻微的武器摇晃，模拟走路/呼吸效果
      const time = Date.now() * 0.001
      const swayQuaternion = new THREE.Quaternion()
      swayQuaternion.setFromEuler(
        new THREE.Euler(
          Math.sin(time * 2) * 0.005, // 上下轻微摇晃
          Math.sin(time * 1.5) * 0.005, // 左右轻微摇晃
          Math.sin(time * 1.2) * 0.003 // 轻微的侧倾
        )
      )

      // 将摇晃应用到枪支的旋转上
      gunRef.current.quaternion.multiply(swayQuaternion)
    }
  })

  return (
    <group ref={gunRef} scale={1.4}>
      <GunModel />
      {/* 枪口闪光 */}
      {muzzleFlash && (
        <>
          <pointLight position={[0, 0, -0.6]} intensity={2} color="#ffaa00" distance={1.5} />
          {/* 闪光粒子效果 */}
          <mesh position={[0, 0, -0.65]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color="#ffaa00" transparent opacity={0.8} />
          </mesh>
        </>
      )}
    </group>
  )
}
