'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { SkillEffectProps } from './types'
import { MeteorStormEffect } from './MeteorStormEffect'
import { FireballEffect } from './FireballEffect'
import { IceArrowEffect } from './IceArrowEffect'
import { BlackholeEffect } from './BlackholeEffect'
import { LightningEffect } from './LightningEffect'
import { MeteorEffect } from './MeteorEffect'
import { ChainLightningEffect } from './ChainLightningEffect'
import { IceAgeEffect } from './IceAgeEffect'

export type { SkillEffectType, SkillEffectProps } from './types'
export { MeteorStormEffect } from './MeteorStormEffect'
export { FireballEffect } from './FireballEffect'
export { IceArrowEffect } from './IceArrowEffect'
export { IceAgeEffect } from './IceAgeEffect'
export { BlackholeEffect } from './BlackholeEffect'
export { LightningEffect } from './LightningEffect'
export { MeteorEffect } from './MeteorEffect'
export { ChainLightningEffect } from './ChainLightningEffect'

/** 技能特效组件 */
export function SkillEffect({
  type,
  active,
  targetPosition,
  targetPositions,
  onComplete,
  className = '',
}: SkillEffectProps) {
  const [isActive, setIsActive] = useState(false)
  const wasActiveRef = useRef(false)

  useEffect(() => {
    if (active && !wasActiveRef.current) {
      wasActiveRef.current = true
      setIsActive(true)
    } else if (!active && wasActiveRef.current) {
      wasActiveRef.current = false
      setIsActive(false)
    }
  }, [active])

  const handleComplete = useCallback(() => {
    setIsActive(false)
    if (onComplete) onComplete()
  }, [onComplete])

  const effectProps = {
    active: isActive,
    onComplete: handleComplete,
    targetPosition,
    targetPositions,
  }

  return (
    <div className={`${className}`}>
      {type === 'meteor-storm' && <MeteorStormEffect {...effectProps} />}
      {type === 'fireball' && <FireballEffect {...effectProps} />}
      {type === 'ice-arrow' && <IceArrowEffect {...effectProps} />}
      {type === 'ice-age' && <IceAgeEffect {...effectProps} />}
      {type === 'blackhole' && <BlackholeEffect {...effectProps} />}
      {type === 'lightning' && <LightningEffect {...effectProps} />}
      {type === 'meteor' && <MeteorEffect {...effectProps} />}
      {type === 'chain-lightning' && <ChainLightningEffect {...effectProps} />}
    </div>
  )
}
