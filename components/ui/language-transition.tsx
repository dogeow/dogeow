'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from '@/hooks/useTranslation'

interface LanguageTransitionProps {
  children: React.ReactNode
  className?: string
}

/**
 * 语言切换过渡动画组件
 * 在语言切换时提供平滑的过渡效果
 */
export function LanguageTransition({ children, className }: LanguageTransitionProps) {
  const { currentLanguage } = useTranslation()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [prevLanguage, setPrevLanguage] = useState(currentLanguage)

  useEffect(() => {
    if (prevLanguage !== currentLanguage) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsTransitioning(true)
      setPrevLanguage(currentLanguage)

      // 短暂的过渡动画
      const timer = setTimeout(() => {
        setIsTransitioning(false)
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [currentLanguage, prevLanguage])

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentLanguage}
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: isTransitioning ? 0.7 : 1,
          y: isTransitioning ? 5 : 0,
        }}
        exit={{ opacity: 0, y: -10 }}
        transition={{
          duration: 0.2,
          ease: 'easeInOut',
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * 文本过渡组件
 * 专门用于文本内容的语言切换过渡
 */
export function TextTransition({ children, className }: LanguageTransitionProps) {
  const { currentLanguage } = useTranslation()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [prevLanguage, setPrevLanguage] = useState(currentLanguage)

  useEffect(() => {
    if (prevLanguage !== currentLanguage) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsTransitioning(true)
      setPrevLanguage(currentLanguage)

      const timer = setTimeout(() => {
        setIsTransitioning(false)
      }, 200)

      return () => clearTimeout(timer)
    }
  }, [currentLanguage, prevLanguage])

  return (
    <motion.span
      key={currentLanguage}
      initial={{ opacity: 0 }}
      animate={{ opacity: isTransitioning ? 0.5 : 1 }}
      transition={{ duration: 0.15 }}
      className={className}
    >
      {children}
    </motion.span>
  )
}
