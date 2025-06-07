"use client"

import React, { useRef, useState, useEffect, Suspense, useCallback, useMemo } from "react"
import { Canvas, useFrame, useThree, ThreeEvent } from "@react-three/fiber"
import { PointerLockControls, /* Text, useTexture, */ Environment } from "@react-three/drei"
import { PointerLockControls as PointerLockControlsImpl } from "three-stdlib"
import * as THREE from "three"
// 注释掉外部组件导入，使用内部定义的组件
// import GunModel from './Gun'
// import Target from './Target'

interface Target {
  id: number
  position: [number, number, number]
  hit: boolean
  scale: number
  speed: number
  direction: [number, number, number]
}

interface ShootingGameProps {
  difficulty: "easy" | "medium" | "hard"
  setGameStarted?: (started: boolean) => void
}

// 爆炸粒子效果
const Explosion = ({ position, color }: { position: [number, number, number], color: string }) => {
  // 创建随机爆炸粒子
  const particles = useMemo(() => {
    const temp = []
    const count = 15
    for(let i = 0; i < count; i++) {
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
          Math.random() * 0.2 - 0.1
        ] as [number, number, number]
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
          <meshBasicMaterial 
            color={color} 
            transparent 
            opacity={opacity} 
          />
        </mesh>
      ))}
    </group>
  )
}

// 目标组件
const Target = ({ position, hit, scale, onClick, id }: { 
  position: [number, number, number], 
  hit: boolean, 
  scale: number,
  onClick: () => void,
  id?: number
}) => {
  const mesh = useRef<THREE.Mesh>(null)
  const [startExplosion, setStartExplosion] = useState(false)
  const [destroyed, setDestroyed] = useState(false)
  
  // 目标的材质 - 修改为useState以确保状态变化时能够重新渲染
  const [targetMaterial, setTargetMaterial] = useState(() => new THREE.MeshStandardMaterial({ 
    color: hit ? "#ff0000" : "#00aaff",
    emissive: hit ? "#550000" : "#004488",
    roughness: 0.2,
    metalness: 0.8
  }))

  // 当hit状态改变时更新材质和触发爆炸
  useEffect(() => {
    if (hit && !startExplosion) {
      setStartExplosion(true)
      
      // 设置目标为红色表示被击中
      setTargetMaterial(new THREE.MeshStandardMaterial({ 
        color: "#ff0000",
        emissive: "#550000",
        roughness: 0.2,
        metalness: 0.8
      }))
      
      // 播放爆炸音效
      try {
        const hitSound = new Audio('/sounds/explode.mp3');
        hitSound.volume = 1; // 降低音量
        hitSound.playbackRate = 3; // 降低播放速度
        
        // 设置最大播放时间
        setTimeout(() => {
          hitSound.pause();
          hitSound.currentTime = 0;
        }, 200); // 缩短爆炸音效播放时间
        
        hitSound.play().catch(err => console.log('音频播放失败', err));
      } catch (e) {
        console.log('音频初始化失败', e);
      }
      
      // 0.2秒后开始消失动画
      setTimeout(() => {
        setDestroyed(true)
      }, 200)
    } else if (!hit) {
      setStartExplosion(false)
      setDestroyed(false)
      setTargetMaterial(new THREE.MeshStandardMaterial({ 
        color: "#00aaff",
        emissive: "#004488",
        roughness: 0.2,
        metalness: 0.8
      }))
    }
  }, [hit, id, startExplosion])

  // 为mesh添加id信息，方便射线检测
  useEffect(() => {
    if (mesh.current && id !== undefined) {
      mesh.current.userData.targetId = id
      mesh.current.userData.isTarget = true // 添加标记以便于识别
      mesh.current.userData.hit = hit // 添加命中状态
    }
  }, [id, hit])

  // 使用useFrame添加轻微的动画效果，使目标更吸引人
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
      e.stopPropagation();
    }
    
    console.log(`直接点击了目标 ${id}`);
    if (!hit) {
      onClick();
    }
  };

  return (
    <>
      <mesh
        ref={mesh}
        position={position}
        scale={[scale, scale, scale]}
        onClick={handleMeshClick}
        // 确保射线能够命中该物体
        castShadow
        receiveShadow
        visible={!destroyed} // 完全破坏后隐藏
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
          <pointLight 
            position={position} 
            intensity={5} 
            distance={8} 
            decay={2}
            color="#ff8800" 
          />
        </Suspense>
      )}
    </>
  )
}

// 枪支组件
const GunModel = () => {
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

// 准星
const Crosshair = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 100 }}>
      <div className="relative w-8 h-8 flex items-center justify-center">
        {/* 中心点 */}
        <div className="absolute w-1 h-1 bg-white rounded-full opacity-80"></div>
        
        {/* 十字准星 - 减小间隔 */}
        <div className="absolute left-1/2 -translate-x-1/2 w-6 h-[1px] bg-white opacity-80 flex justify-between">
          <div className="w-2 h-full"></div>
          <div className="w-2 h-full"></div>
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 h-6 w-[1px] bg-white opacity-80 flex flex-col justify-between">
          <div className="w-full h-2"></div>
          <div className="w-full h-2"></div>
        </div>
      </div>
    </div>
  )
}

// 游戏状态UI
const GameUI = ({ score, timeLeft, gameOver, onRestart }: { 
  score: number, 
  timeLeft: number, 
  gameOver: boolean,
  onRestart: () => void
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="w-full pt-16 px-4">
        <div className="flex justify-between max-w-3xl mx-auto">
          <div className="bg-black/80 p-2 px-4 rounded-lg text-white font-medium shadow-lg">
            得分: {score}
          </div>
          <div className="bg-black/80 p-2 px-4 rounded-lg text-white font-medium shadow-lg">
            时间: {timeLeft.toFixed(1)}s
          </div>
        </div>
      </div>
      
      {gameOver && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 pointer-events-auto">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full">
            <h2 className="text-2xl font-bold mb-2">游戏结束</h2>
            <p className="mb-4">你的最终得分: {score}</p>
            <button 
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
              onClick={onRestart}
            >
              再来一局
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// 子弹组件
const Bullet = ({ initialPosition, direction }: { 
  initialPosition: THREE.Vector3,
  direction: THREE.Vector3,
  onHit?: () => void
}) => {
  const bulletRef = useRef<THREE.Mesh>(null);
  const [position, setPosition] = useState(initialPosition);
  const [hit, setHit] = useState(false);
  const [lifetime, setLifetime] = useState(0);
  const speed = 100; // 子弹速度
  
  // 创建拖尾效果
  const trailPositions = useRef<THREE.Vector3[]>([]);
  const trailMaterial = useRef(new THREE.LineBasicMaterial({
    color: '#ff8800',
    opacity: 0.6,
    transparent: true
  }));
  
  // 初始化拖尾
  useEffect(() => {
    // 创建拖尾点
    const points = [];
    for(let i = 0; i < 10; i++) {
      points.push(initialPosition.clone());
    }
    trailPositions.current = points;
  }, [initialPosition]);
  
  // 子弹飞行动画
  useFrame((_, delta) => {
    if (hit) return;
    
    // 更新生存时间
    setLifetime(prev => prev + delta);
    
    // 2秒后自动销毁
    if (lifetime > 2) {
      setHit(true);
      return;
    }
    
    if (bulletRef.current) {
      // 更新子弹位置
      const newPosition = position.clone().add(
        direction.clone().multiplyScalar(speed * delta)
      );
      setPosition(newPosition);
      bulletRef.current.position.copy(newPosition);
      
      // 更新拖尾
      trailPositions.current.shift();
      trailPositions.current.push(newPosition.clone());
    }
  });
  
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
              onUpdate={(self) => {
                const positions = [];
                for (const pos of trailPositions.current) {
                  positions.push(pos.x, pos.y, pos.z);
                }
                self.setAttribute(
                  'position',
                  new THREE.Float32BufferAttribute(positions, 3)
                );
              }}
            />
            <primitive object={trailMaterial.current} attach="material" />
          </line>
        )}
      </group>
      
      {/* 子弹光效 */}
      <pointLight 
        position={position}
        color="#ff8800"
        intensity={0.5}
        distance={2}
        decay={1}
      />
    </>
  );
};

// 第一人称武器组件
const FPSWeapon = ({ muzzleFlash }: { muzzleFlash: boolean }) => {
  const { camera } = useThree();
  const gunRef = useRef<THREE.Group>(null);
  
  // 使用useFrame使枪支跟随相机旋转
  useFrame(() => {
    if (gunRef.current) {
      // 基础位置偏移，基于相机的局部坐标系
      const offsetPosition = new THREE.Vector3(0.15, -0.1, -0.3);
      
      // 获取相机的位置和旋转
      const cameraPosition = camera.position.clone();
      const cameraQuaternion = camera.quaternion.clone();
      
      // 创建一个局部位置向量，将偏移应用到相机局部空间
      const localPosition = offsetPosition.clone();
      
      // 将局部位置向量应用相机的旋转，得到世界空间中的位置
      localPosition.applyQuaternion(cameraQuaternion);
      
      // 计算最终位置（相机位置+旋转后的局部位置）
      const finalPosition = cameraPosition.clone().add(localPosition);
      
      // 应用位置
      gunRef.current.position.copy(finalPosition);
      
      // 完全跟随相机旋转
      gunRef.current.quaternion.copy(cameraQuaternion);
      
      // 添加轻微的武器摇晃，模拟走路/呼吸效果
      const time = Date.now() * 0.001;
      const swayQuaternion = new THREE.Quaternion();
      swayQuaternion.setFromEuler(
        new THREE.Euler(
          Math.sin(time * 2) * 0.005,  // 上下轻微摇晃
          Math.sin(time * 1.5) * 0.005, // 左右轻微摇晃
          Math.sin(time * 1.2) * 0.003  // 轻微的侧倾
        )
      );
      
      // 将摇晃应用到枪支的旋转上
      gunRef.current.quaternion.multiply(swayQuaternion);
    }
  });
  
  return (
    <group ref={gunRef} scale={1.4}>
      <GunModel />
      {/* 枪口闪光 */}
      {muzzleFlash && (
        <>
          <pointLight 
            position={[0, 0, -0.6]} 
            intensity={2} 
            color="#ffaa00" 
            distance={1.5}
          />
          {/* 闪光粒子效果 */}
          <mesh position={[0, 0, -0.65]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color="#ffaa00" transparent opacity={0.8} />
          </mesh>
        </>
      )}
    </group>
  );
};

// 游戏场景
const GameScene = ({ 
  difficulty, 
  onScore, 
  gameStarted,
  setGameStarted,
  useFallbackControls = false,
  onError = () => {}
}: { 
  difficulty: "easy" | "medium" | "hard",
  onScore: () => void,
  gameStarted: boolean,
  setGameStarted: (started: boolean) => void,
  useFallbackControls?: boolean,
  onError?: (message: string) => void
}) => {
  const { camera, gl, scene } = useThree()
  const controls = useRef<PointerLockControlsImpl | null>(null)
  const [targets, setTargets] = useState<Target[]>([])
  
  // 子弹状态
  const [bullets, setBullets] = useState<{
    id: number;
    position: THREE.Vector3;
    direction: THREE.Vector3;
  }[]>([]);
  
  // 子弹计数器
  const bulletCounter = useRef(0);
  
  // 麦克雷左轮射击冷却控制
  const [canShoot, setCanShoot] = useState(true);
  const shootCooldown = useRef(500); // 麦克雷左轮手枪射击间隔约为0.5秒
  
  // 指针锁状态
  const [, setPointerLocked] = useState(false);
  
  // 根据难度设置参数
  const difficultySettings = {
    easy: { targetCount: 8, targetSpeed: 0.01, gameAreaSize: 20 },
    medium: { targetCount: 12, targetSpeed: 0.02, gameAreaSize: 25 },
    hard: { targetCount: 16, targetSpeed: 0.05, gameAreaSize: 30 }
  }
  
  const settings = difficultySettings[difficulty]

  // 初始化目标
  useEffect(() => {
    const newTargets: Target[] = []
    
    for (let i = 0; i < settings.targetCount; i++) {
      const gameArea = settings.gameAreaSize
      
      // 随机位置，但要保持一定距离，确保目标更远
      const position: [number, number, number] = [
        (Math.random() - 0.5) * gameArea,
        (Math.random() - 0.5) * gameArea / 2 + 2,
        (Math.random() - 0.5) * gameArea - (gameArea / 2) // 确保z轴距离更远
      ]
      
      // 随机移动方向
      const direction: [number, number, number] = [
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ]
      
      // 归一化方向向量
      const length = Math.sqrt(direction[0]**2 + direction[1]**2 + direction[2]**2)
      direction[0] /= length
      direction[1] /= length
      direction[2] /= length
      
      newTargets.push({
        id: i,
        position,
        hit: false,
        scale: Math.random() * 0.3 + 0.5,
        speed: Math.random() * 0.01 + settings.targetSpeed,
        direction
      })
    }
    
    setTargets(newTargets)
  }, [settings.gameAreaSize, settings.targetCount, settings.targetSpeed])

  // 爆炸效果
  const [explosions, setExplosions] = useState<{
    id: number;
    position: [number, number, number];
    color: string;
  }[]>([]);
  
  const startExplosion = useCallback((position: [number, number, number], color: string = '#ff4444') => {
    const explosionId = Date.now() + Math.random();
    setExplosions(prev => [...prev, { id: explosionId, position, color }]);
    
    // 2秒后移除爆炸效果
    setTimeout(() => {
      setExplosions(prev => prev.filter(exp => exp.id !== explosionId));
    }, 2000);
  }, []);

  // 处理击中目标
  const handleTargetHit = useCallback((id: number) => {
    console.log("击中目标:", id);
    
    // 播放击中音效
    try {
      const hitSound = new Audio('/sounds/explode.mp3');
      hitSound.volume = 0.2; // 降低音量
      hitSound.playbackRate = 1.0; // 降低播放速度
      
      // 设置最大播放时间
      setTimeout(() => {
        hitSound.pause();
        hitSound.currentTime = 0;
      }, 800); // 缩短爆炸音效播放时间
      
      hitSound.play().catch(err => console.log('音频播放失败', err));
      
      // 添加震动反馈（如果浏览器支持）
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (e) {
      console.log('音频初始化失败', e);
    }
    
    // 立即更新目标状态
    setTargets(prev => 
      prev.map(target => 
        target.id === id ? { ...target, hit: true } : target
      )
    )
    
    onScore()
    
    // 2秒后重生目标
    setTimeout(() => {
      setTargets(prev => 
        prev.map(target => {
          if (target.id === id) {
            const gameArea = settings.gameAreaSize
            
            const position: [number, number, number] = [
              (Math.random() - 0.5) * gameArea,
              (Math.random() - 0.5) * gameArea / 2 + 2,
              (Math.random() - 0.5) * gameArea - (gameArea / 2) // 确保z轴距离更远
            ]
            
            const direction: [number, number, number] = [
              (Math.random() - 0.5) * 2,
              (Math.random() - 0.5) * 2,
              (Math.random() - 0.5) * 2
            ]
            
            // 归一化方向向量
            const length = Math.sqrt(direction[0]**2 + direction[1]**2 + direction[2]**2)
            
            return { 
              ...target,
              position,
              hit: false,
              direction: [
                direction[0] / length,
                direction[1] / length,
                direction[2] / length
              ]
            }
          }
          return target
        })
      )
    }, 2000)
  }, [onScore, settings.gameAreaSize])

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
        const shouldChangeDirection = Math.random() < 0.02 // 每帧有2%的概率改变方向
        
        if (x < -halfArea || x > halfArea) {
          newDx = -dx
          // 碰到边界时增加随机性
          if (Math.random() < 0.5) {
            newDy = (Math.random() - 0.5) * 2
            newDz = (Math.random() - 0.5) * 2
          }
        }
        if (y < -halfArea / 2 || y > halfArea / 2 + 5) {
          newDy = -dy
          // 碰到边界时增加随机性
          if (Math.random() < 0.5) {
            newDx = (Math.random() - 0.5) * 2
            newDz = (Math.random() - 0.5) * 2
          }
        }
        if (z < -halfArea - 5 || z > halfArea - 5) {
          newDz = -dz
          // 碰到边界时增加随机性
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
        const length = Math.sqrt(newDx**2 + newDy**2 + newDz**2)
        newDx /= length
        newDy /= length
        newDz /= length
        
        return {
          ...target,
          position: [x, y, z] as [number, number, number],
          direction: [newDx, newDy, newDz] as [number, number, number]
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
      // 过滤掉已经碰撞的子弹
      return prevBullets.filter(bullet => {
        // 为每个子弹创建射线
        const raycaster = new THREE.Raycaster(
          bullet.position.clone(),
          bullet.direction.clone(),
          0,
          2 // 检测距离
        );
        
        // 获取场景中的目标
        const hitTargets: { id: number, distance: number }[] = [];
        
        targets.forEach(target => {
          if (!target.hit) {
            // 为每个目标创建碰撞球体
            const sphere = new THREE.Sphere(
              new THREE.Vector3(...target.position),
              target.scale * 1.2 // 稍微增大碰撞范围
            );
            
            // 检查射线是否与球体相交
            const intersectionPoint = new THREE.Vector3();
            if (raycaster.ray.intersectSphere(sphere, intersectionPoint)) {
              // 计算交点与子弹当前位置的距离
              const distance = intersectionPoint.distanceTo(bullet.position);
              hitTargets.push({ id: target.id, distance });
            }
          }
        });
        
        // 如果击中目标，触发爆炸
        if (hitTargets.length > 0) {
          // 按距离排序，取最近的目标
          hitTargets.sort((a, b) => a.distance - b.distance);
          handleTargetHit(hitTargets[0].id);
          return false; // 移除此子弹
        }
        
        return true; // 保留子弹
      });
    });
  }, [targets, handleTargetHit]);
  
  // 每帧更新子弹碰撞
  useFrame(() => {
    if (gameStarted && bullets.length > 0) {
      checkBulletCollisions();
    }
  });
  
  // 处理普通模式下的射击
  const handleShoot = useCallback(() => {
    if (!gameStarted || !canShoot) return
    
    // 设置射击冷却
    setCanShoot(false);
    setTimeout(() => {
      setCanShoot(true);
    }, shootCooldown.current);
    
    // 显示枪口闪光
    showMuzzleFlash()
    
    // 创建一个射线，从相机位置沿视线方向
    const raycaster = new THREE.Raycaster();
    
    // 确保使用精确的屏幕中心点(0,0)发射射线
    // 在Three.js中，(0,0)是屏幕的正中心
    const exactCenter = new THREE.Vector2(0, 0);
    raycaster.setFromCamera(exactCenter, camera);
    
    // 使用与射线完全相同的方向创建子弹
    const bulletDirection = raycaster.ray.direction.clone();
    // 子弹从相机位置发射
    const bulletPosition = camera.position.clone();
    // 稍微前移子弹起始位置，避免与相机碰撞
    bulletPosition.add(bulletDirection.clone().multiplyScalar(0.1));
    
    // 创建子弹，使用与射线相同的起点和方向
    setBullets(prev => [
      ...prev, 
      { 
        id: bulletCounter.current++, 
        position: bulletPosition,
        direction: bulletDirection
      }
    ]);
    
    // 限制子弹数量，防止性能问题
    if (bullets.length > 20) {
      setBullets(prev => prev.slice(prev.length - 20));
    }
    
    // 播放射击音效
    try {
      const shotSound = new Audio('/sounds/shot.mp3');
      shotSound.volume = 0.15; // 降低音量
      shotSound.playbackRate = 0.8; // 降低播放速度
      
      setTimeout(() => {
        shotSound.pause();
        shotSound.currentTime = 0;
      }, 500); // 缩短播放时间
      
      shotSound.play().catch(err => console.log('音频播放失败', err));
    } catch (e) {
      console.log('音频初始化失败', e);
    }
    
    // 收集所有可能被击中的目标
    const hittableTargets: { targetId: number; distance: number; point: THREE.Vector3 }[] = [];
    
    // 方法1：使用球体检测
    targets.forEach(target => {
      if (!target.hit) {
        // 为每个目标创建一个碰撞球体
        const sphere = new THREE.Sphere(
          new THREE.Vector3(...target.position),
          target.scale * 1.2 // 略微增大碰撞范围
        );
        
        // 检查射线是否与球体相交
        const intersectPoint = new THREE.Vector3();
        const didIntersect = raycaster.ray.intersectSphere(sphere, intersectPoint);
        
        if (didIntersect) {
          // 计算距离
          const distance = intersectPoint.distanceTo(camera.position);
          hittableTargets.push({ 
            targetId: target.id, 
            distance: distance,
            point: intersectPoint.clone()
          });
        }
      }
    });
    
    // 方法2：传统的Mesh检测（作为备用）
    if (hittableTargets.length === 0) {
      // 收集所有未被击中的目标Mesh
      const targetMeshes: THREE.Object3D[] = [];
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh && 
            object.userData && 
            object.userData.isTarget && 
            !object.userData.hit) {
          targetMeshes.push(object);
        }
      });
      
      // 检测射线与目标Mesh的交点
      const intersects = raycaster.intersectObjects(targetMeshes, true);
      
      for (const intersect of intersects) {
        let targetObject: THREE.Object3D | null = intersect.object;
        
        // 查找具有targetId的父对象
        while (targetObject && !targetObject.userData?.targetId) {
          targetObject = targetObject.parent;
        }
        
        if (targetObject && targetObject.userData?.targetId !== undefined) {
          hittableTargets.push({
            targetId: targetObject.userData.targetId,
            distance: intersect.distance,
            point: intersect.point.clone()
          });
        }
      }
    }
    
    // 处理命中结果
    if (hittableTargets.length > 0) {
      // 按距离排序，击中最近的目标
      hittableTargets.sort((a, b) => a.distance - b.distance);
      const hitResult = hittableTargets[0];
      
      // 处理目标被击中
      handleTargetHit(hitResult.targetId);
    }
  }, [camera, gameStarted, scene, handleTargetHit, showMuzzleFlash, targets, bullets.length, bulletCounter, canShoot, shootCooldown]);
  
  // 监听鼠标点击事件（正常模式下）
  useEffect(() => {
    if (useFallbackControls || !gameStarted) return
    
    const handleClick = () => {
      handleShoot()
    }
    
    window.addEventListener('click', handleClick)
    window.addEventListener('mousedown', handleClick) // 额外添加mousedown事件以提高响应性
    
    return () => {
      window.removeEventListener('click', handleClick)
      window.removeEventListener('mousedown', handleClick)
    }
  }, [gameStarted, handleShoot, useFallbackControls])
  
  // 添加键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 按空格射击
      if (e.key === ' ' && gameStarted && !useFallbackControls) {
        e.preventDefault(); // 阻止默认行为
        handleShoot();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, handleShoot, useFallbackControls]);

  // 使用effect来检测gameStarted状态的变化
  useEffect(() => {
    let pointerLockErrorReported = false;
    
    // 如果使用备用控制模式，不需要锁定指针
    if (gameStarted && !useFallbackControls && controls.current) {
      try {
        // 延迟一帧再锁定指针，避免状态同步问题
        const timeoutId = setTimeout(() => {
          try {
            if (controls.current && typeof controls.current.lock === 'function') {
              controls.current.lock();
            }
          } catch (error) {
            if (!pointerLockErrorReported) {
              console.error("锁定指针失败:", error);
              onError("无法锁定鼠标指针，请尝试使用备用控制模式");
              pointerLockErrorReported = true;
            }
          }
        }, 300); // 等待300ms，让DOM完全渲染
        
        return () => clearTimeout(timeoutId);
      } catch (error) {
        if (!pointerLockErrorReported) {
          console.error("请求动画帧失败:", error);
          onError("无法锁定鼠标指针，请尝试使用备用控制模式");
          pointerLockErrorReported = true;
        }
      }
    }
    
    // 添加锁定状态变化监听
    const handlePointerLockChange = () => {
      // 检查当前文档的指针锁定状态
      const isLocked = 
        document.pointerLockElement === gl.domElement ||
        (document as Document & { mozPointerLockElement?: Element }).mozPointerLockElement === gl.domElement ||
        (document as Document & { webkitPointerLockElement?: Element }).webkitPointerLockElement === gl.domElement;
      
      setPointerLocked(isLocked);
      
      // 如果应该是游戏状态但指针未锁定，则可能是用户按了ESC
      if (gameStarted && !isLocked) {
        // 处理用户通过ESC退出了指针锁定
        console.log("指针锁定已退出，更新游戏状态");
        setGameStarted(false);
      }
    };
    
    // 添加退出前的处理逻辑
    const handleBeforeUnload = () => {
      // 确保在页面卸载前释放指针锁
      if (document.exitPointerLock) {
        document.exitPointerLock();
      }
    };
    
    // 注册事件监听器
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('mozpointerlockchange', handlePointerLockChange);
    document.addEventListener('webkitpointerlockchange', handlePointerLockChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      // 组件卸载时，确保释放指针锁
      try {
        if (document.pointerLockElement || 
            (document as Document & { mozPointerLockElement?: Element }).mozPointerLockElement || 
            (document as Document & { webkitPointerLockElement?: Element }).webkitPointerLockElement) {
          if (document.exitPointerLock) {
            document.exitPointerLock();
          } else if ((document as Document & { mozExitPointerLock?: () => void }).mozExitPointerLock) {
            (document as Document & { mozExitPointerLock?: () => void }).mozExitPointerLock?.();
          } else if ((document as Document & { webkitExitPointerLock?: () => void }).webkitExitPointerLock) {
            (document as Document & { webkitExitPointerLock?: () => void }).webkitExitPointerLock?.();
          }
        }
      } catch (e) {
        console.error("释放指针锁出错:", e);
      }
      
      // 移除事件监听器
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('mozpointerlockchange', handlePointerLockChange);
      document.removeEventListener('webkitpointerlockchange', handlePointerLockChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [gameStarted, useFallbackControls, onError, gl, setGameStarted, startExplosion]);

  return (
    <>
      {!useFallbackControls && (
        <Suspense fallback={null}>
          {/* 使用错误处理包装PointerLockControls */}
          {gameStarted ? (
            <PointerLockControls ref={controls} />
          ) : null}
        </Suspense>
      )}
      
      {/* 环境光 */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      
      {/* 场景 */}
      <Environment preset="sunset" />
      <fog attach="fog" args={['#0c1445', 15, 50]} />
      
      {/* 太阳 - 完全重设为明亮的红黄色圆盘 */}
      <mesh position={[0, 15, -40]} rotation={[0, 0, 0]}>
        <circleGeometry args={[10, 32]} />
        <meshStandardMaterial color="#ff3300" emissive="#ff3300" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      
      {/* 太阳强光 */}
      <pointLight position={[0, 15, -40]} color="#ff5500" intensity={10} distance={200} decay={0.5} />
      
      {/* 平行光源模拟太阳光 */}
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
      
      {/* 使用useMemo减少闪烁问题 */}
      {useMemo(() => {
        // 减少星星数量
        const stars = [];
        for (let i = 0; i < 50; i++) {
          const x = (Math.random() - 0.5) * 180;
          const y = Math.random() * 40 + 10;
          const z = (Math.random() - 0.5) * 180;
          const size = Math.random() * 0.15 + 0.05;
          stars.push(
            <mesh key={i} position={[x, y, z]}>
              <sphereGeometry args={[size, 4, 4]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
            </mesh>
          );
        }
        return stars;
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
        <Bullet 
          key={bullet.id}
          initialPosition={bullet.position}
          direction={bullet.direction}
        />
      ))}
      
      {/* 武器 */}
      <Suspense fallback={null}>
        <FPSWeapon muzzleFlash={muzzleFlash} />
      </Suspense>
      
      {/* 爆炸效果 */}
      {explosions.map(explosion => (
        <Explosion 
          key={explosion.id}
          position={explosion.position}
          color={explosion.color}
        />
      ))}
    </>
  )
}

// 主游戏组件
const ShootingGame = ({ difficulty, setGameStarted }: ShootingGameProps) => {
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [gameOver, setGameOver] = useState(false)
  const [gameStarted, setGameStartedState] = useState(false)
  const [showStartOverlay, setShowStartOverlay] = useState(true) // 控制开始弹窗显示的状态
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  
  // 错误状态处理
  const [pointerLockError, setPointerLockError] = useState<string | null>(null)
  
  // 防止空格键引起页面滚动
  useEffect(() => {
    const preventSpacebarScroll = (e: KeyboardEvent) => {
      // 如果按下空格键，阻止默认行为（滚动）
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
      }
    };

    // 添加事件监听器
    window.addEventListener('keydown', preventSpacebarScroll, { passive: false });

    // 清理函数移除事件监听器
    return () => {
      window.removeEventListener('keydown', preventSpacebarScroll);
    };
  }, []);
  
  // 处理得分
  const handleScore = () => {
    setScore(prev => prev + 10)
  }
  
  // 倒计时
  useEffect(() => {
    if (!gameStarted || gameOver) return
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer)
          setGameOver(true)
          return 0
        }
        return prev - 0.1
      })
    }, 100)
    
    return () => clearInterval(timer)
  }, [gameStarted, gameOver])
  
  // 重新开始游戏
  const handleRestart = () => {
    setScore(0)
    setTimeLeft(60)
    setGameOver(false)
  }
  
  // 处理浏览器兼容性问题的提示
  const [browserSupport, setBrowserSupport] = useState({
    supported: true,
    message: '',
    useFallback: false
  })

  // 统一处理游戏开始的函数 - 声明提前到使用之前
  const startGame = useCallback(() => {
    // 先隐藏开始弹窗
    setShowStartOverlay(false);
    
    // 设置游戏状态
    setGameStartedState(true);
    if (setGameStarted) setGameStarted(true);
    
    // 使用延迟而不是requestAnimationFrame
    setTimeout(() => {
      // 尝试锁定指针
      if (!browserSupport.useFallback && canvasRef.current) {
        try {
          if (canvasRef.current.requestPointerLock) {
            canvasRef.current.requestPointerLock();
          } else if ((canvasRef.current as HTMLCanvasElement & { mozRequestPointerLock?: () => void }).mozRequestPointerLock) {
            (canvasRef.current as HTMLCanvasElement & { mozRequestPointerLock?: () => void }).mozRequestPointerLock?.();
          } else if ((canvasRef.current as HTMLCanvasElement & { webkitRequestPointerLock?: () => void }).webkitRequestPointerLock) {
            (canvasRef.current as HTMLCanvasElement & { webkitRequestPointerLock?: () => void }).webkitRequestPointerLock?.();
          }
        } catch (e) {
          console.error("锁定指针失败:", e);
          setBrowserSupport(prev => ({...prev, useFallback: true}));
        }
      }
    }, 300); // 使用300ms延迟确保DOM已完全更新
  }, [browserSupport.useFallback, setGameStarted, canvasRef]);
  
  // 检查浏览器兼容性
  useEffect(() => {
    const checkBrowserSupport = () => {
      if (!('pointerLockElement' in document) && 
          !('mozPointerLockElement' in document) && 
          !('webkitPointerLockElement' in document)) {
        setBrowserSupport({
          supported: false,
          message: '您的浏览器不支持Pointer Lock API，游戏将以有限功能模式运行。',
          useFallback: true
        })
        return
      }
      
      // 检查是否在移动设备上
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        setBrowserSupport({
          supported: false,
          message: '射击游戏需要使用鼠标控制，不支持移动设备。请在台式机或笔记本电脑上尝试。',
          useFallback: false
        })
        return
      }
    }
    
    checkBrowserSupport()
    
    // 添加错误监听
    const handlePointerLockError = () => {
      setPointerLockError("浏览器拒绝了指针锁定请求，可能是权限问题或浏览器限制。")
      // 自动切换到备用模式
      setBrowserSupport(prev => ({
        ...prev,
        useFallback: true
      }))
    }
    
    document.addEventListener('pointerlockerror', handlePointerLockError)
    document.addEventListener('mozpointerlockerror', handlePointerLockError)
    document.addEventListener('webkitpointerlockerror', handlePointerLockError)
    
    return () => {
      document.removeEventListener('pointerlockerror', handlePointerLockError)
      document.removeEventListener('mozpointerlockerror', handlePointerLockError)
      document.removeEventListener('webkitpointerlockerror', handlePointerLockError)
    }
  }, [])
  
  // 通过键盘控制启动游戏
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果按下Enter或空格，且游戏未开始，则开始游戏
      if ((e.key === 'Enter' || e.key === ' ') && !gameStarted && !gameOver) {
        e.preventDefault(); // 阻止默认行为
        startGame();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver, startGame]);
  
  // 点击Canvas区域启动游戏
  const handleCanvasClick = useCallback(() => {
    if (!gameStarted && !gameOver) {
      startGame();
    }
  }, [gameStarted, gameOver, startGame]);

  // 清除错误并重试
  const handleRetry = () => {
    setPointerLockError(null);
    
    // 先释放指针锁
    try {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      } else if ((document as Document & { mozPointerLockElement?: Element }).mozPointerLockElement) {
        (document as Document & { mozExitPointerLock?: () => void }).mozExitPointerLock?.();
      } else if ((document as Document & { webkitPointerLockElement?: Element }).webkitPointerLockElement) {
        (document as Document & { webkitExitPointerLock?: () => void }).webkitExitPointerLock?.();
      }
    } catch (e) {
      console.error("释放指针锁失败:", e);
    }
    
    // 重置游戏状态
    setGameStartedState(false);
    if (setGameStarted) setGameStarted(false);
    setGameOver(false);
    setShowStartOverlay(true); // 显示开始弹窗
  }
  
  // 处理回到设置的函数
  const handleBackToSettings = useCallback(() => {
    // 释放指针锁
    try {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      } else if ((document as Document & { mozPointerLockElement?: Element }).mozPointerLockElement) {
        (document as Document & { mozExitPointerLock?: () => void }).mozExitPointerLock?.();
      } else if ((document as Document & { webkitPointerLockElement?: Element }).webkitPointerLockElement) {
        (document as Document & { webkitExitPointerLock?: () => void }).webkitExitPointerLock?.();
      }
    } catch (e) {
      console.error("释放指针锁失败:", e);
    }
    
    // 重置游戏状态
    setGameStartedState(false);
    setShowStartOverlay(true);
    
    // 通知父组件
    if (setGameStarted) setTimeout(() => setGameStarted(false), 100);
  }, [setGameStarted]);

  if (!browserSupport.supported && !browserSupport.useFallback) {
    return (
      <div className="flex items-center justify-center h-full bg-black/10 p-4">
        <div className="bg-white p-6 rounded-lg max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">浏览器兼容性问题</h2>
          <p className="mb-4">{browserSupport.message}</p>
          <p className="text-sm text-gray-600">
            此游戏需要浏览器支持指针锁定API以实现第一人称视角控制。
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div 
        ref={canvasContainerRef}
        onClick={handleCanvasClick}
        style={{ width: '100%', height: '100%', cursor: gameStarted ? 'none' : 'pointer', position: 'relative' }}
      >
        <Canvas 
          shadows 
          ref={canvasRef} 
          camera={{ fov: 65, position: [0, 1.6, 0], rotation: [0, 0, 0] }}
          onCreated={({ gl, camera }) => {
            console.log("Canvas已创建");
            gl.setClearColor("#020617");
            // 确保相机初始角度平视
            camera.rotation.set(0, 0, 0);
          }}
          style={{ touchAction: 'none' }} // 防止触摸事件引起页面滚动
          className="outline-none" // 防止焦点边框
        >
          <GameScene 
            difficulty={difficulty} 
            onScore={handleScore} 
            gameStarted={gameStarted && !gameOver}
            setGameStarted={setGameStartedState}
            useFallbackControls={browserSupport.useFallback}
            onError={setPointerLockError}
          />
        </Canvas>
        
        {/* 只在游戏进行中显示准心，放在Canvas容器内部确保对齐 */}
        {gameStarted && !gameOver && <Crosshair />}
      </div>
      
      {/* 返回设置按钮 */}
      {gameStarted && (
        <button 
          className="fixed top-16 left-4 z-50 bg-black/80 hover:bg-black/90 text-white px-4 py-2 rounded-lg border border-white/20 shadow-lg text-sm font-medium"
          onClick={handleBackToSettings}
        >
          返回设置
        </button>
      )}
      
      <GameUI 
        score={score} 
        timeLeft={timeLeft} 
        gameOver={gameOver}
        onRestart={handleRestart}
      />
      
      {/* 开始游戏弹窗 */}
      {showStartOverlay && !gameOver && !pointerLockError && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full text-center">
            <h2 className="text-xl font-bold mb-2">准备就绪</h2>
            <p className="mb-4">点击按钮开始游戏</p>
            {browserSupport.useFallback ? (
              <p className="text-sm text-red-500 mb-2">
                您的浏览器不完全支持此游戏的控制方式，正在使用有限功能模式运行。
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                <strong>注意:</strong> 游戏将请求锁定您的鼠标指针。按ESC键可随时退出。
              </p>
            )}
            <button 
              className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
              onClick={startGame}
            >
              开始游戏
            </button>
          </div>
        </div>
      )}
      
      {/* 错误提示 */}
      {pointerLockError && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-2 text-red-600">指针锁定错误</h2>
            <p className="mb-4">{pointerLockError}</p>
            <div className="flex gap-2">
              <button 
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
                onClick={handleRetry}
              >
                重试
              </button>
              <button 
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded"
                onClick={() => {
                  setPointerLockError(null);
                  setBrowserSupport(prev => ({...prev, useFallback: true}));
                }}
              >
                继续（使用备用控制）
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 调试信息和游戏说明 */}
      <div className="fixed bottom-2 inset-x-0 flex justify-center">
        <div className="bg-black/70 p-2 text-white text-xs max-w-fit mx-auto">
          <p>空格键或鼠标左键：射击 | ESC：暂停</p>
        </div>
      </div>
    </>
  )
}

export default ShootingGame 