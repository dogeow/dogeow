"use client"

import * as React from "react"
import Image from "next/image"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { useBackgroundStore } from "@/stores/backgroundStore"

// 系统提供的背景图列表
const systemBackgrounds = [
  { id: "none", name: "无背景", url: "" },
  { id: "bg1", name: "你的名字？·untitled", url: "/backgrounds/wallhaven-72rd8e_2560x1440-1.webp" },
  { id: "bg2", name: "书房·我的世界", url: "/backgrounds/我的世界.png" },
  { id: "bg3", name: "2·untitled", url: "/backgrounds/F_RIhiObMAA-c8N.jpeg" },
]

export function BackgroundSettings() {
  const { backgroundImage, setBackgroundImage } = useBackgroundStore()
  const [selectedOption, setSelectedOption] = useState<string>("none")
  const [customImage, setCustomImage] = useState<string>("")
  const [previewImage, setPreviewImage] = useState<string>("")
  
  // 初始化选择状态
  useEffect(() => {
    if (!backgroundImage) {
      setSelectedOption("none")
      return
    }
    
    const systemBg = systemBackgrounds.find(bg => bg.url === backgroundImage)
    if (systemBg) {
      setSelectedOption(systemBg.id)
    } else {
      setSelectedOption("custom")
      setCustomImage(backgroundImage)
      setPreviewImage(backgroundImage)
    }
  }, [backgroundImage])
  
  // 处理选项变更
  const handleOptionChange = (value: string) => {
    setSelectedOption(value)
    
    if (value !== "custom") {
      const selected = systemBackgrounds.find(bg => bg.id === value)
      if (selected) {
        setBackgroundImage(selected.url)
      }
    }
  }
  
  // 处理自定义图片上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith("image/")) {
      toast("请上传图片文件", {
        description: "只支持图片格式的文件",
        variant: "destructive",
      })
      return
    }
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setCustomImage(result)
      setPreviewImage(result)
      setBackgroundImage(result)
    }
    reader.readAsDataURL(file)
  }
  
  return (
    <div className="space-y-4 py-2">
      <RadioGroup value={selectedOption} onValueChange={handleOptionChange}>
        {systemBackgrounds.map((bg) => (
          <div key={bg.id} className="flex items-center space-x-2 mb-2">
            <RadioGroupItem value={bg.id} id={bg.id} />
            <Label htmlFor={bg.id}>{bg.name}</Label>
            {bg.url && (
              <div className="ml-auto w-10 h-10 relative overflow-hidden rounded">
                <Image 
                  src={bg.url} 
                  alt={bg.name} 
                  fill 
                  className="object-cover" 
                />
              </div>
            )}
          </div>
        ))}
        
        <div className="flex items-center space-x-2 mb-2">
          <RadioGroupItem value="custom" id="custom" />
          <Label htmlFor="custom">自定义背景</Label>
        </div>
      </RadioGroup>
      
      {selectedOption === "custom" && (
        <div className="space-y-2">
          <Input 
            type="file" 
            accept="image/*" 
            onChange={handleFileUpload} 
            className="cursor-pointer"
          />
          
          {previewImage && (
            <div className="w-full h-32 relative overflow-hidden rounded mt-2">
              <Image 
                src={previewImage} 
                alt="预览" 
                fill 
                className="object-cover" 
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
} 