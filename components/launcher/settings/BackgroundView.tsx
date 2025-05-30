"use client"

import React from 'react'
import { BackButton } from '@/components/ui/back-button'
import { BackgroundButton } from './BackgroundButton'
import { UploadButton } from './UploadButton'
import { SettingsDivider } from './SettingsDivider'
import { configs } from '@/app/configs'
import type { CustomBackground } from '../SettingsPanel'

interface BackgroundViewProps {
  onBack: () => void
  backgroundImage: string
  onSetBackground: (url: string) => void
  customBackgrounds: CustomBackground[]
  onUploadBackground: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function BackgroundView({
  onBack,
  backgroundImage,
  onSetBackground,
  customBackgrounds,
  onUploadBackground
}: BackgroundViewProps) {
  return (
    <>
      <BackButton 
        onClick={onBack}
        className="shrink-0"
      />
      
      <SettingsDivider />
      
      {/* 系统背景图片选项 */}
      {configs.systemBackgrounds.map(bg => (
        <BackgroundButton
          key={bg.id}
          background={bg}
          isSelected={backgroundImage === bg.url}
          onSelect={onSetBackground}
        />
      ))}
      
      {/* 用户自定义背景 */}
      {customBackgrounds.map(bg => (
        <BackgroundButton
          key={bg.id}
          background={bg}
          isSelected={backgroundImage === bg.url}
          onSelect={onSetBackground}
        />
      ))}
      
      {/* 上传按钮 */}
      <UploadButton
        onUpload={onUploadBackground}
        title="上传自定义背景"
      />
    </>
  )
} 