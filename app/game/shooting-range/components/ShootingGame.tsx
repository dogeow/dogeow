"use client"

import React, { useRef, useState, useEffect, Suspense, useCallback, useMemo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { PointerLockControls, Text, useTexture, Environment } from "@react-three/drei"
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
    color: hit ? "#ff0000" : "#0088ff",
    emissive: hit ? "#550000" : "#003366",
    roughness: 0.2,
    metalness: 0.8
  }))

  // 当hit状态改变时更新材质和触发爆炸
  useEffect(() => {
    console.log(`Target ${id} hit state: ${hit}`);
    
    if (hit && !startExplosion) {
      console.log(`Starting explosion for target ${id}`);
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
        hitSound.volume = 0.4;
        hitSound.playbackRate = 1.2; // 加快音效播放速度
        
        // 设置最大播放时间
        setTimeout(() => {
          hitSound.pause();
          hitSound.currentTime = 0;
        }, 1000); // 爆炸音效播放时间
        
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
        color: "#0088ff",
        emissive: "#003366",
        roughness: 0.2,
        metalness: 0.8
      }))
    }
  }, [hit, id])

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
  const handleMeshClick = (e: any) => {
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
      
      {/* 瞄准器 - 与准心位置对齐 */}
      <mesh position={[0, 0.15, -0.1]}>
        <boxGeometry args={[0.05, 0.05, 0.2]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      {/* 枪口参考点 - 帮助调试射击位置 */}
      <mesh position={[0, 0, -0.65]} visible={false}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
    </group>
  )
}

// 准星
const Crosshair = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 100 }}>
      <div className="relative w-10 h-10 flex items-center justify-center">
        {/* 十字准星 */}
        <div className="absolute w-8 h-0.5 bg-white opacity-90"></div>
        <div className="absolute h-8 w-0.5 bg-white opacity-90"></div>
        
        {/* 中心点 - 保留小红点增加精确度 */}
        <div className="absolute w-1 h-1 bg-red-500 rounded-full"></div>
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
      <div className="container mx-auto p-4">
        <div className="flex justify-between">
          <div className="bg-black/50 p-2 rounded text-white">
            得分: {score}
          </div>
          <div className="bg-black/50 p-2 rounded text-white">
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
const Bullet = ({ initialPosition, direction, onHit }: { 
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
                for (let pos of trailPositions.current) {
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

// 游戏场景
const GameScene = ({ 
  difficulty, 
  onScore, 
  gameStarted,
  setGameStarted,
  useFallbackControls = false,
  onError = (message: string) => {}
}: { 
  difficulty: "easy" | "medium" | "hard",
  onScore: () => void,
  gameStarted: boolean,
  setGameStarted: (started: boolean) => void,
  useFallbackControls?: boolean,
  onError?: (message: string) => void
}) => {
  const { camera, gl, scene } = useThree()
  const controls = useRef<any>(null)
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
  
  // 鼠标位置状态 (用于备用控制)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  
  // 根据难度设置参数
  const difficultySettings = {
    easy: { targetCount: 8, targetSpeed: 0.01, gameAreaSize: 12 },
    medium: { targetCount: 12, targetSpeed: 0.02, gameAreaSize: 15 },
    hard: { targetCount: 16, targetSpeed: 0.03, gameAreaSize: 18 }
  }
  
  const settings = difficultySettings[difficulty]

  // 初始化目标
  useEffect(() => {
    const newTargets: Target[] = []
    
    for (let i = 0; i < settings.targetCount; i++) {
      const gameArea = settings.gameAreaSize
      
      // 随机位置，但要保持一定距离
      const position: [number, number, number] = [
        (Math.random() - 0.5) * gameArea,
        (Math.random() - 0.5) * gameArea / 2 + 2,
        (Math.random() - 0.5) * gameArea - 5
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
  }, [difficulty])

  // 处理击中目标
  const handleTargetHit = useCallback((id: number) => {
    console.log("击中目标:", id);
    
    // 播放击中音效
    try {
      const hitSound = new Audio('/sounds/explode.mp3');
      hitSound.volume = 0.4;
      hitSound.playbackRate = 1.2; // 加快音效播放速度
      
      // 设置最大播放时间
      setTimeout(() => {
        hitSound.pause();
        hitSound.currentTime = 0;
      }, 1000); // 爆炸音效播放时间
      
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
              (Math.random() - 0.5) * gameArea - 5
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
        
        if (x < -halfArea || x > halfArea) newDx = -dx
        if (y < -halfArea / 2 || y > halfArea / 2 + 5) newDy = -dy
        if (z < -halfArea - 5 || z > halfArea - 5) newDz = -dz
        
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
  
  // 调试模式
  const [debugMode, setDebugMode] = useState(false)
  
  // 强制更新所有目标状态（调试用）
  const forceExplodeAll = useCallback(() => {
    console.log("强制引爆所有目标");
    setTargets(prev => 
      prev.map(target => ({...target, hit: true}))
    )
  }, [])
  
  // 调试用射线
  const [debugRay, setDebugRay] = useState<{
    origin: THREE.Vector3;
    direction: THREE.Vector3;
    length: number;
  } | null>(null);
  
  // 显示命中点 - 调试用
  const [hitPosition, setHitPosition] = useState<THREE.Vector3 | null>(null);
  
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
              
              // 调试模式下记录命中位置
              if (debugMode) {
                setHitPosition(intersectionPoint.clone());
              }
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
  }, [targets, handleTargetHit, debugMode]);
  
  // 每帧更新子弹碰撞
  useFrame(() => {
    if (gameStarted && bullets.length > 0) {
      checkBulletCollisions();
    }
  });
  
  // 处理普通模式下的射击
  const handleShoot = useCallback(() => {
    if (!gameStarted || !canShoot) return
    
    console.log("射击!");
    
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
    
    // 在调试模式下显示射线
    if (debugMode) {
      setDebugRay({
        origin: camera.position.clone(),
        direction: bulletDirection.clone(),
        length: 50
      });
      
      // 清除之前的命中点
      setHitPosition(null);
    }
    
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
      shotSound.volume = 0.3;
      shotSound.playbackRate = 0.9;
      
      setTimeout(() => {
        shotSound.pause();
        shotSound.currentTime = 0;
      }, 800);
      
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
      
      console.log(`命中目标 ID: ${hitResult.targetId}, 距离: ${hitResult.distance.toFixed(2)}`);
      
      // 在调试模式下显示命中点
      if (debugMode) {
        setHitPosition(hitResult.point);
      }
      
      // 处理目标被击中
      handleTargetHit(hitResult.targetId);
    } else {
      console.log("未命中任何目标");
    }
  }, [camera, gameStarted, scene, handleTargetHit, showMuzzleFlash, targets, bullets.length, bulletCounter, canShoot, shootCooldown, debugMode]);
  
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
  
  // 在调试模式下显示射线
  const updateDebugRay = useCallback(() => {
    if (!debugMode || !camera) return;
    
    const origin = new THREE.Vector3().copy(camera.position);
    const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
    
    setDebugRay({
      origin,
      direction,
      length: 50
    });
  }, [debugMode, camera]);
  
  // 更新调试射线
  useFrame(() => {
    if (debugMode) {
      updateDebugRay();
    }
  });
  
  // 添加键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 按D键切换调试模式
      if (e.key === 'd' || e.key === 'D') {
        setDebugMode(prev => !prev);
        console.log("调试模式:", !debugMode);
        
        // 在开启调试模式时，生成一个参考射线
        if (!debugMode && camera) {
          const origin = camera.position.clone();
          const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
          
          setDebugRay({
            origin,
            direction,
            length: 50
          });
        }
      }
      
      // 按X强制引爆所有目标
      if (e.key === 'x' || e.key === 'X') {
        forceExplodeAll();
      }
      
      // 按空格射击
      if (e.key === ' ' && gameStarted && !useFallbackControls) {
        handleShoot();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [debugMode, forceExplodeAll, gameStarted, handleShoot, useFallbackControls, updateDebugRay]);

  // 使用effect来检测gameStarted状态的变化
  useEffect(() => {
    console.log(`游戏场景中的gameStarted状态变为: ${gameStarted}`);
    
    // 如果使用备用控制模式，不需要锁定指针
    if (gameStarted && !useFallbackControls && controls.current) {
      try {
        console.log("尝试锁定鼠标指针");
        controls.current.lock();
      } catch (error) {
        console.error("锁定指针失败:", error);
        onError("无法锁定鼠标指针，请尝试使用备用控制模式");
      }
    }
  }, [gameStarted, useFallbackControls, onError]);

  return (
    <>
      {!useFallbackControls && <PointerLockControls ref={controls} />}
      
      {/* 环境光 */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      
      {/* 场景 */}
      <Environment preset="sunset" />
      <fog attach="fog" args={['#111', 10, 50]} />
      
      {/* 地面 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#335577" />
      </mesh>
      
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
      
      {/* 调试辅助 - 射线可视化 */}
      {debugMode && (
        <group>
          {/* 摄像机前方直线 - 精确显示准心射线 */}
          <line>
            <bufferGeometry
              attach="geometry"
              onUpdate={(self) => {
                const start = camera.position.clone();
                const forward = new THREE.Vector3(0, 0, -1)
                  .applyQuaternion(camera.quaternion)
                  .normalize();
                const end = start.clone().add(forward.multiplyScalar(100));
                
                const positions = [
                  start.x, start.y, start.z,
                  end.x, end.y, end.z
                ];
                
                self.setAttribute(
                  'position',
                  new THREE.Float32BufferAttribute(positions, 3)
                );
              }}
            />
            <lineBasicMaterial color="#ff0000" linewidth={3} />
          </line>
          
          {/* 准心指向的点 */}
          <mesh position={[0, 0, -5]} scale={[0.05, 0.05, 0.05]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial color="#00ff00" />
          </mesh>
          
          {/* 命中点标记 */}
          {hitPosition && (
            <mesh position={hitPosition} scale={[0.1, 0.1, 0.1]}>
              <sphereGeometry args={[1, 16, 16]} />
              <meshBasicMaterial color="#ff00ff" />
            </mesh>
          )}
          
          {/* 标记点击位置的线 */}
          {debugRay && (
            <line>
              <bufferGeometry
                attach="geometry"
                onUpdate={(self) => {
                  const start = debugRay.origin;
                  const end = start.clone().add(
                    debugRay.direction.clone().multiplyScalar(debugRay.length)
                  );
                  
                  const positions = [
                    start.x, start.y, start.z,
                    end.x, end.y, end.z
                  ];
                  
                  self.setAttribute(
                    'position',
                    new THREE.Float32BufferAttribute(positions, 3)
                  );
                }}
              />
              <lineBasicMaterial color="#00ffff" linewidth={3} />
            </line>
          )}
        </group>
      )}
      
      {/* 武器 */}
      <Suspense fallback={null}>
        {/* 调整枪的位置，确保视觉上与射击位置一致 */}
        <group position={[0.15, -0.3, -0.3]} rotation={[0, 0, 0]}>
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
      </Suspense>
      
      {/* 远景 */}
      <mesh position={[0, 10, -50]}>
        <sphereGeometry args={[30, 16, 16]} />
        <meshBasicMaterial color="#000011" side={THREE.BackSide} />
      </mesh>
    </>
  )
}

// 主游戏组件
const ShootingGame = ({ difficulty }: ShootingGameProps) => {
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [gameOver, setGameOver] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  
  // 错误状态处理
  const [pointerLockError, setPointerLockError] = useState<string | null>(null)
  
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
  
  // 检查浏览器兼容性
  useEffect(() => {
    const checkBrowserSupport = () => {
      const elem = document.body
      
      if (!('pointerLockElement' in document) && 
          !('mozPointerLockElement' in document) && 
          !('webkitPointerLockElement' in document)) {
        console.log("浏览器不支持Pointer Lock API，使用备用控制模式");
        setBrowserSupport({
          supported: false,
          message: '您的浏览器不支持Pointer Lock API，游戏将以有限功能模式运行。',
          useFallback: true
        })
        return
      }
      
      // 检查是否在移动设备上
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        console.log("当前设备是移动设备，不推荐在移动设备上玩射击游戏");
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
      console.error("Pointer Lock Error")
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
        console.log("通过键盘开始游戏");
        setGameStarted(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver]);
  
  // 点击Canvas区域启动游戏
  const handleCanvasClick = useCallback(() => {
    console.log("画布被点击", { gameStarted, gameOver });
    
    // 直接设置游戏开始状态
    if (!gameStarted && !gameOver) {
      console.log("正在尝试开始游戏...");
      setGameStarted(true);
      
      // 通过事件传播，会触发Three.js场景中的控制器锁定
      if (canvasRef.current) {
        // 确保canvas元素仍然在DOM中
        if (document.body.contains(canvasRef.current)) {
          try {
            // 模拟点击
            const event = new MouseEvent('click', {
              view: window,
              bubbles: true,
              cancelable: true
            });
            canvasRef.current.dispatchEvent(event);
            console.log("已分发Canvas点击事件");
          } catch (error) {
            console.error("分发事件失败:", error);
          }
        }
      }
    }
  }, [gameStarted, gameOver, setGameStarted]);

  // 清除错误并重试
  const handleClearErrorAndRetry = () => {
    setPointerLockError(null)
    // 如果用户明确选择重试，关闭备用模式
    if (browserSupport.useFallback) {
      setBrowserSupport(prev => ({
        ...prev,
        useFallback: false
      }))
    }
    // 重置游戏状态
    setGameStarted(false)
    setGameOver(false)
  }

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
          camera={{ fov: 75, position: [0, 1.6, 0] }}
          onCreated={({ gl }) => {
            console.log("Canvas已创建");
            gl.setClearColor("#020617");
          }}
          style={{ touchAction: 'none' }} // 防止触摸事件引起页面滚动
          className="outline-none" // 防止焦点边框
        >
          <GameScene 
            difficulty={difficulty} 
            onScore={handleScore} 
            gameStarted={gameStarted && !gameOver}
            setGameStarted={setGameStarted}
            useFallbackControls={browserSupport.useFallback}
            onError={setPointerLockError}
          />
        </Canvas>
        
        {/* 只在游戏进行中显示准心，放在Canvas容器内部确保对齐 */}
        {gameStarted && !gameOver && <Crosshair />}
      </div>
      
      <GameUI 
        score={score} 
        timeLeft={timeLeft} 
        gameOver={gameOver}
        onRestart={handleRestart}
      />
      
      {/* 错误提示 */}
      {pointerLockError && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-2 text-red-600">指针锁定错误</h2>
            <p className="mb-4">{pointerLockError}</p>
            <div className="flex gap-2">
              <button 
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
                onClick={handleClearErrorAndRetry}
              >
                重试
              </button>
              <button 
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded"
                onClick={() => {
                  setPointerLockError(null)
                  // 继续使用备用模式
                }}
              >
                继续（使用备用控制）
              </button>
            </div>
          </div>
        </div>
      )}
      
      {!gameStarted && !gameOver && !pointerLockError && (
        <div 
          className="fixed inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
          onClick={() => {
            console.log("开始游戏遮罩被点击");
            handleCanvasClick();
            setGameStarted(true); // 直接设置游戏状态为开始
          }}
        >
          <div className="bg-white p-6 rounded-lg max-w-sm w-full text-center">
            <h2 className="text-xl font-bold mb-2">准备就绪</h2>
            <p className="mb-4">点击屏幕开始游戏</p>
            {browserSupport.useFallback ? (
              <p className="text-sm text-red-500 mb-2">
                您的浏览器不完全支持此游戏的控制方式，正在使用有限功能模式运行。
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                <strong>注意:</strong> 游戏将请求锁定您的鼠标指针。按ESC键可随时退出。
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* 调试信息和游戏说明 */}
      <div className="fixed bottom-2 right-2 bg-black/50 p-2 rounded text-white text-xs">
        <p>空格键：射击 | D：调试模式 | X：引爆所有目标 | ESC：暂停</p>
      </div>
    </>
  )
}

export default ShootingGame 