import * as THREE from 'three'
import * as CANNON from 'cannon-es'

// 场景引用接口
export interface SceneRef {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  world: CANNON.World
  ball: { mesh: THREE.Mesh; body: CANNON.Body } | null
  pins: Array<{ mesh: THREE.Mesh; body: CANNON.Body }>
  lane: { mesh: THREE.Mesh; body: CANNON.Body } | null
  animationId: number | null
  throwStartTime?: number
  aimLine?: THREE.Line
  powerBar?: THREE.Line
  materials: {
    groundMaterial: CANNON.Material
    ballMaterial: CANNON.Material
    pinMaterial: CANNON.Material
  }
}

// 物理材质返回类型
export interface PhysicsMaterials {
  groundMaterial: CANNON.Material
  ballMaterial: CANNON.Material
  pinMaterial: CANNON.Material
}

// 场景元素返回类型
export interface SceneElements {
  laneMesh: THREE.Mesh
  laneBody: CANNON.Body
}

// 球对象类型
export interface BallObject {
  mesh: THREE.Mesh
  body: CANNON.Body
}

// 球瓶对象类型
export interface PinObject {
  mesh: THREE.Mesh
  body: CANNON.Body
}
