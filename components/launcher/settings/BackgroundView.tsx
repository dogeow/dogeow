'use client'

import React from 'react'
import { UploadButton } from './UploadButton'
import { getTranslatedConfigs } from '@/app/configs'
import { useTranslation } from '@/hooks/useTranslation'
import type { CustomBackground } from '../SettingsPanel'
import { Check } from 'lucide-react'
import Image from 'next/image'

interface BackgroundViewProps {
  onBack: () => void
  backgroundImage: string
  onSetBackground: (url: string) => void
  customBackgrounds: CustomBackground[]
  onUploadBackground: (e: React.ChangeEvent<HTMLInputElement>) => void
  showBackButton?: boolean
}

export function BackgroundView({
  onBack,
  backgroundImage,
  onSetBackground,
  customBackgrounds,
  onUploadBackground,
  showBackButton = true,
}: BackgroundViewProps) {
  const { t } = useTranslation()
  const translatedConfigs = getTranslatedConfigs(t)

  return (
    <div className="flex flex-col gap-3">
      {/* 背景图片网格 - 改为2列更大 */}
      <div className="grid grid-cols-2 gap-2">
        {/* 系统背景图片选项 */}
        {translatedConfigs.systemBackgrounds
          .filter(bg => bg.id && bg.name)
          .map(bg => (
            <button
              key={bg.id!}
              onClick={() => onSetBackground(bg.url!)}
              className={`group relative aspect-[16/9] overflow-hidden rounded-lg border-2 transition-all hover:opacity-90 ${
                backgroundImage === bg.url ? 'border-primary' : 'border-transparent'
              }`}
            >
              {bg.url ? (
                <Image
                  src={`/images/backgrounds/${bg.url}`}
                  alt={bg.name!}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="bg-muted flex h-full w-full items-center justify-center">
                  <span className="text-xs">None</span>
                </div>
              )}
              {/* 名字标签 */}
              <div className="absolute right-0 bottom-0 left-0 bg-black/50 px-2 py-1">
                <span className="text-[10px] text-white">{bg.name}</span>
              </div>
              {/* 选中标记 */}
              {backgroundImage === bg.url && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Check className="h-5 w-5 text-white" />
                </div>
              )}
            </button>
          ))}

        {/* 用户自定义背景 */}
        {customBackgrounds.map(bg => (
          <button
            key={bg.id}
            onClick={() => onSetBackground(bg.url)}
            className={`group relative aspect-[16/9] overflow-hidden rounded-lg border-2 transition-all hover:opacity-90 ${
              backgroundImage === bg.url ? 'border-primary' : 'border-transparent'
            }`}
          >
            {bg.url ? (
              <Image src={bg.url} alt={bg.name} fill className="object-cover" />
            ) : (
              <div className="bg-muted flex h-full w-full items-center justify-center">
                <span className="text-xs">None</span>
              </div>
            )}
            {/* 名字标签 */}
            <div className="absolute right-0 bottom-0 left-0 bg-black/50 px-2 py-1">
              <span className="text-[10px] text-white">{bg.name}</span>
            </div>
            {/* 选中标记 */}
            {backgroundImage === bg.url && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Check className="h-5 w-5 text-white" />
              </div>
            )}
          </button>
        ))}

        {/* 上传按钮 */}
        <UploadButton onUpload={onUploadBackground} title="上传" />
      </div>
    </div>
  )
}
