/**
 * 枪支3D模型组件
 */
export function GunModel() {
  return (
    <group>
      {/* 枪身 - 调整形状和位置 */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[0.2, 0.1, 0.4]} />
        <meshStandardMaterial color="#222222" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* 枪管 - 修改为更合理的形状 */}
      <mesh position={[0, 0, -0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
        <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* 握把 - 调整角度和尺寸 */}
      <mesh position={[0, -0.15, 0.05]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.15, 0.25, 0.12]} />
        <meshStandardMaterial color="#222222" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* 瞄准器 - 更精细的形状 */}
      <mesh position={[0, 0.07, -0.05]}>
        <boxGeometry args={[0.05, 0.03, 0.15]} />
        <meshStandardMaterial color="#333333" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* 枪口 */}
      <mesh position={[0, 0, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.04, 0.03, 8]} />
        <meshStandardMaterial color="#111111" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  )
}
