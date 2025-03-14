"use client"

import * as React from "react"
import { Settings } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { BackgroundSettings } from "./settings/BackgroundSettings"

export function SettingsToggle() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">打开设置</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>应用设置</DialogTitle>
          <DialogDescription>
            自定义您的应用外观和行为
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="background" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="background">背景设置</TabsTrigger>
          </TabsList>
          <TabsContent value="background">
            <BackgroundSettings />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 