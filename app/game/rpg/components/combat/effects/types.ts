/** 技能特效类型 */
export type SkillEffectType =
  | 'meteor-storm'
  | 'fireball'
  | 'ice-arrow'
  | 'ice-age'
  | 'blackhole'
  | 'heal'
  | 'lightning'
  | 'meteor'
  | 'chain-lightning'

/** 技能特效组件属性 */
export interface SkillEffectProps {
  /** 技能类型 */
  type: SkillEffectType
  /** 是否激活特效 */
  active: boolean
  /** 持续时间（毫秒） */
  duration?: number
  /** 目标位置（0-1 之间的相对坐标） */
  targetPosition?: { x: number; y: number }
  /** 多个目标位置（用于连锁闪电等技能） */
  targetPositions?: { x: number; y: number }[]
  /** 回调：特效结束 */
  onComplete?: () => void
  /** 回调：技能视觉上命中目标时（用于提前显示扣血，避免等整段尾效播完） */
  onHit?: () => void
  /** 自定义样式类 */
  className?: string
}

/** 单个特效组件的通用 props */
export interface EffectBaseProps {
  active: boolean
  onComplete?: () => void
  /** 技能视觉命中时调用，可早于 onComplete */
  onHit?: () => void
  targetPosition?: { x: number; y: number }
  targetPositions?: { x: number; y: number }[]
}
