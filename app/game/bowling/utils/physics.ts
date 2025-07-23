import * as CANNON from 'cannon-es'
import { MATERIALS_CONFIG } from '../config/constants'
import type { PhysicsMaterials } from '../types/scene'

// 创建物理材料和接触材料
export function createPhysicsMaterials(world: CANNON.World): PhysicsMaterials {
  const groundMaterial = new CANNON.Material('ground')
  const ballMaterial = new CANNON.Material('ball')
  const pinMaterial = new CANNON.Material('pin')

  const createContactMaterial = (
    mat1: CANNON.Material,
    mat2: CANNON.Material,
    config: { friction: number; restitution: number }
  ) => {
    return new CANNON.ContactMaterial(mat1, mat2, {
      ...config,
      contactEquationStiffness: 1e8,
      contactEquationRelaxation: 3,
      frictionEquationStiffness: 1e8,
      frictionEquationRelaxation: 3,
    })
  }

  world.addContactMaterial(
    createContactMaterial(ballMaterial, groundMaterial, MATERIALS_CONFIG.BALL_GROUND)
  )
  world.addContactMaterial(
    createContactMaterial(ballMaterial, pinMaterial, MATERIALS_CONFIG.BALL_PIN)
  )
  world.addContactMaterial(
    createContactMaterial(pinMaterial, groundMaterial, MATERIALS_CONFIG.PIN_GROUND)
  )
  world.addContactMaterial(
    createContactMaterial(pinMaterial, pinMaterial, MATERIALS_CONFIG.PIN_PIN)
  )

  return { groundMaterial, ballMaterial, pinMaterial }
}

// 检查物理体是否稳定
export function isBodySettled(body: CANNON.Body, isBall: boolean = false): boolean {
  const pos = body.position

  // 条件1: 是否已经出界
  const isOutOfBounds = pos.y < -5 || pos.z < -30 || pos.z > 15 || Math.abs(pos.x) > 12
  if (isOutOfBounds) return true

  // 条件2: 速度是否足够低（静止）
  // 对球使用更严格的标准，确保它真的停下来了
  const velocityThreshold = isBall ? 0.05 : 0.1
  const angularThreshold = isBall ? 0.05 : 0.1
  const isStable =
    body.velocity.length() < velocityThreshold && body.angularVelocity.length() < angularThreshold

  return isStable
}

// 检查场景是否稳定
export function checkSceneIsStable(
  ballBody: CANNON.Body,
  pinBodies: CANNON.Body[],
  throwStartTime: number | null
): boolean {
  if (!throwStartTime) return false

  const currentTime = Date.now()
  const elapsedTime = currentTime - throwStartTime

  // 超时检查（15秒）
  if (elapsedTime > 15000) {
    console.log('⏰ 投球时间到（15秒），强制处理结果')
    return true
  }

  // 最少等待时间（球必须有时间到达球瓶区域）
  if (elapsedTime < 2000) {
    return false
  }

  // 检查球是否到达了球瓶区域或已经出界
  const ballPos = ballBody.position
  const ballReachedPinArea = ballPos.z <= -15 // 球瓶区域大概在z=-20左右
  const ballOutOfBounds =
    ballPos.y < -5 || ballPos.z < -30 || ballPos.z > 15 || Math.abs(ballPos.x) > 12

  // 如果球还没到达球瓶区域且没有出界，继续等待
  if (!ballReachedPinArea && !ballOutOfBounds && elapsedTime < 8000) {
    return false
  }

  // 检查球是否已经结束运动（使用更严格的标准）
  if (!isBodySettled(ballBody, true)) {
    return false
  }

  // 检查所有球瓶是否也已经结束运动
  for (const pinBody of pinBodies) {
    if (!isBodySettled(pinBody, false)) {
      return false // 找到一个还在运动的球瓶
    }
  }

  // 如果所有物体都已结束运动，则场景稳定
  console.log('✅ 所有物体均已稳定或出界，处理结果')
  return true
}
